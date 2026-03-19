"""
智谱AI服务 v2.0 - 生产级实现
包含Prompt工程优化、Function Call集成、成本管控
"""
import json
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
import asyncio
import time
from functools import lru_cache
import hashlib

from zhipuai import ZhipuAI
from app.core.config import settings

logger = logging.getLogger(__name__)


class PromptTemplate(Enum):
    """Prompt模板类型"""
    ITINERARY_PLANNING = "itinerary_planning"
    ITINERARY_OPTIMIZATION = "itinerary_optimization"
    ATTRACTION_RECOMMENDATION = "attraction_recommendation"
    DINING_RECOMMENDATION = "dining_recommendation"
    TRAVEL_QA = "travel_qa"
    CUSTOMER_SERVICE = "customer_service"
    TRAVEL_GUIDE = "travel_guide"


class TokenUsage:
    """Token使用记录"""
    user_id: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    model: str
    timestamp: datetime
    request_type: str


class TokenBudget:
    """Token预算配置"""
    daily_limit: int
    daily_cost_limit: float
    user_daily_limit: Optional[int] = None
    alert_threshold: float = 0.8


class GLMServiceV2:
    """智谱AI服务 v2.0 - 生产级实现"""

    # 模型定价表 (元/千tokens)
    PRICING = {
        "glm-4": {"input": 0.01, "output": 0.04},
        "glm-4-flash": {"input": 0.001, "output": 0.002},
        "glm-3-turbo": {"input": 0.0005, "output": 0.001},
    }

    def __init__(self):
        self.api_key = settings.GLM_API_KEY
        self.client = ZhipuAI(api_key=self.api_key) if self.api_key else None

        # 模型配置
        self.model_configs = {
            "itinerary_planning": {
                "model": "glm-4",
                "temperature": 0.7,
                "max_tokens": 6000
            },
            "recommendation": {
                "model": "glm-4-flash",
                "temperature": 0.5,
                "max_tokens": 2000
            },
            "qa": {
                "model": "glm-4-flash",
                "temperature": 0.3,
                "max_tokens": 1000
            },
            "generation": {
                "model": "glm-4",
                "temperature": 0.8,
                "max_tokens": 4000
            }
        }

        # Token预算配置
        self.budget = TokenBudget(
            daily_limit=1000000,  # 100万tokens/天
            daily_cost_limit=50.0,  # 50元/天
            user_daily_limit=10000,  # 1万tokens/用户/天
            alert_threshold=0.8
        )

        # Token使用统计
        self.token_stats = {
            "total_tokens": 0,
            "input_tokens": 0,
            "output_tokens": 0,
            "call_count": 0,
            "error_count": 0
        }

        # Function定义
        self.FUNCTIONS = [
            {
                "name": "search_attractions",
                "description": "搜索江浙沪地区的旅游景点",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "keyword": {"type": "string", "description": "搜索关键词"},
                        "city": {"type": "string", "description": "城市名称"},
                        "attraction_type": {
                            "type": "string",
                            "enum": ["风景名胜", "文化古迹", "娱乐场所", "公园广场", "博物馆", "购物"]
                        },
                        "price_max": {"type": "number", "description": "门票价格上限(元)"},
                        "rating_min": {"type": "number", "description": "最低评分(0-5)"}
                    },
                    "required": ["keyword"]
                }
            },
            {
                "name": "get_attraction_detail",
                "description": "获取景点详细信息",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "attraction_id": {"type": "string", "description": "景点ID"}
                    },
                    "required": ["attraction_id"]
                }
            },
            {
                "name": "search_restaurants",
                "description": "搜索餐厅",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "keyword": {"type": "string", "description": "搜索关键词"},
                        "city": {"type": "string", "description": "城市名称"},
                        "cuisine_type": {"type": "string", "description": "菜系类型"},
                        "price_max": {"type": "number", "description": "人均价格上限(元)"}
                    },
                    "required": []
                }
            },
            {
                "name": "get_weather",
                "description": "获取天气预报",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string", "description": "城市名称"},
                        "days": {"type": "integer", "default": 7, "description": "预报天数"}
                    },
                    "required": ["city"]
                }
            }
        ]

    @property
    def is_available(self) -> bool:
        return self.client is not None and self.api_key

    async def check_limit(self, user_id: str, estimated_tokens: int = 0) -> bool:
        """检查是否超出限制"""
        # 检查总限制
        today_usage = await self._get_daily_usage()
        if today_usage["total_tokens"] + estimated_tokens > self.budget.daily_limit:
            logger.warning(f"超出每日Token限制: {today_usage['total_tokens'] + estimated_tokens}")
            return False

        # 检查用户限制
        user_usage = await self._get_user_usage(user_id)
        if user_usage["total_tokens"] + estimated_tokens > self.budget.user_daily_limit:
            return False

        return True

    def get_model_for_task(self, task_type: str) -> str:
        """根据任务类型选择合适的模型"""
        task_model_map = {
            "simple_qa": "glm-3-turbo",
            "recommendation": "glm-4-flash",
            "planning": "glm-4",
            "generation": "glm-4",
            "optimization": "glm-4"
        }
        return task_model_map.get(task_type, "glm-4-flash")

    @lru_cache(maxsize=100)
    def optimize_prompt(self, template: PromptTemplate, **kwargs) -> str:
        """优化Prompt长度"""
        if template == PromptTemplate.ITINERARY_PLANNING:
            return self._build_itinerary_prompt(**kwargs)
        elif template == PromptTemplate.ATTRACTION_RECOMMENDATION:
            return self._build_attraction_prompt(**kwargs)
        elif template == PromptTemplate.DINING_RECOMMENDATION:
            return self._build_dining_prompt(**kwargs)
        return ""

    def _build_itinerary_prompt(
        self,
        days: int,
        budget: float,
        departure: str,
        destinations: List[str],
        companion_type: str,
        interests: List[str],
        travel_style: str,
        travel_mode: str,
        age_group: str,
        pace_preference: str,
        special_needs: List[str],
        date_range: List[str],
        season: str
    ) -> str:
        """构建行程规划Prompt"""
        destinations_str = "、".join(destinations)
        interests_str = "、".join(interests)
        special_needs_str = "、".join(special_needs) if special_needs else "无"
        date_str = f"{date_range[0]}至{date_range[1]}" if date_range else "未指定"

        return f"""# 江浙沪旅游行程规划专家

## 用户需求
```json
{{
  "基础信息": {{
    "出发城市": "{departure}",
    "目的地": ["{destinations_str}"],
    "出行日期": "{date_str}",
    "季节": "{season}"
  }},
  "人员信息": {{
    "人群": "{age_group}，{companion_type}"
  }},
  "偏好设置": {{
    "兴趣": ["{interests_str}"],
    "风格": "{travel_style}",
    "节奏": "{pace_preference}",
    "交通": "{travel_mode}"
  }},
  "约束条件": {{
    "预算": {budget}元,
    "特殊需求": ["{special_needs_str}"]
  }}
}}
```

## 规划要求
1. 时间可行性：每日行程≤8小时
2. 体力合理性：根据人群安排强度
3. 预算控制：尽量控制在{budget}元内
4. 兴趣匹配：最大化兴趣偏好
5. 路线优化：减少回头路

## 输出格式
```json
{{
  "itinerary": {{
    "title": "3天江浙沪行程",
    "summary": "行程概述",
    "total_budget": {{
      "total": 总费用
    }},
    "daily_plans": [
      {{
        "day": 1,
        "theme": "主题",
        "city": "城市",
        "morning": {{
          "time": "08:00-12:00",
          "activities": [
            {{
              "name": "景点",
              "location": "地址",
              "duration_minutes": 120,
              "cost": 费用,
              "tips": "提示"
            }}
          ]
        }}
      }}
    ]
  }}
}}"""

    def _build_attraction_prompt(
        self,
        city: str,
        interests: List[str],
        season: str,
        day_count: int,
        age_group: str
    ) -> str:
        """构建景点推荐Prompt"""
        interests_str = "、".join(interests)
        return f"""# 江浙沪景点推荐专家

## 背景
{city}游玩{day_count}天，季节：{season}，兴趣：{interests_str}

## 输出格式
```json
{{
  "recommendations": [
    {{
      "name": "景点名称",
      "type": "景点类型",
      "city": "{city}",
      "address": "地址",
      "price": 门票价格,
      "duration": 推荐时长,
      "rating": 评分,
      "tips": "提示"
    }}
  ]
}}"""

    async def generate_itinerary_v2(
        self,
        user_id: str,
        request_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """生成行程 v2.0"""
        if not self.is_available:
            raise Exception("GLM API未配置")

        # 检查Token限制
        estimated_tokens = 6000
        if not await self.check_limit(user_id, estimated_tokens):
            raise Exception("Token使用已达今日上限")

        # 构建Prompt
        prompt = self.optimize_prompt(
            PromptTemplate.ITINERARY_PLANNING,
            **request_data
        )

        # 调用API
        config = self.model_configs["itinerary_planning"]
        response = await self._call_api(
            prompt=prompt,
            system_prompt="你是江浙沪旅游规划专家",
            user_id=user_id,
            **config
        )

        # 解析响应
        return await self._parse_json_response(response)

    async def chat_with_tools(
        self,
        user_id: str,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """与AI对话，支持Function Call"""
        if not self.is_available:
            return {
                "success": False,
                "message": "GLM API未配置",
                "ai_response": "抱歉，AI服务暂时不可用"
            }

        # 构建消息
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})

        # 调用API
        try:
            response = self.client.chat.completions.create(
                model="glm-4",
                messages=messages,
                tools=self.FUNCTIONS,
                tool_choice="auto"
            )

            # 统计Token
            usage = response.usage
            self.token_stats["call_count"] += 1
            self.token_stats["input_tokens"] += usage.prompt_tokens
            self.token_stats["output_tokens"] += usage.completion_tokens
            self.token_stats["total_tokens"] += usage.total_tokens

            assistant_message = response.choices[0].message
            tool_calls = assistant_message.tool_calls or []

            # 执行工具调用
            tool_results = []
            for tool_call in tool_calls:
                result = await self._execute_tool(tool_call.function.name, json.loads(tool_call.function.arguments))
                tool_results.append({
                    "tool_call_id": tool_call.id,
                    "name": tool_call.function.name,
                    "result": result
                })

            # 返回最终回复
            final_messages = messages
            final_messages.append({
                "role": "assistant",
                "content": assistant_message.content,
                "tool_calls": tool_calls
            })

            for result in tool_results:
                final_messages.append({
                    "role": "tool",
                    "tool_call_id": result["tool_call_id"],
                    "content": json.dumps(result["result"])
                })

            final_response = self.client.chat.completions.create(
                model="glm-4",
                messages=final_messages
            )

            return {
                "success": True,
                "ai_response": final_response.choices[0].message.content,
                "tool_calls": tool_results,
                "usage": {
                    "input_tokens": usage.prompt_tokens,
                    "output_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens
                }
            }

        except Exception as e:
            self.token_stats["error_count"] += 1
            logger.error(f"GLM API调用失败: {str(e)}")
            return {
                "success": False,
                "message": str(e),
                "ai_response": "服务暂时不可用，请稍后再试"
            }

    async def _execute_tool(self, function_name: str, function_args: Dict) -> Any:
        """执行工具调用"""
        # 这里应该调用实际的业务服务
        # 模拟实现
        if function_name == "search_attractions":
            return {
                "data": [
                    {
                        "id": "demo_1",
                        "name": "示例景点",
                        "location": "示例地址",
                        "rating": 4.5
                    }
                ]
            }
        elif function_name == "get_weather":
            return {
                "data": [
                    {
                        "date": "2025-03-13",
                        "temperature_high": 25,
                        "temperature_low": 18,
                        "weather": "晴"
                    }
                ]
            }
        return {"error": "未实现的工具"}

    async def _call_api(
        self,
        prompt: str,
        system_prompt: str,
        user_id: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> str:
        """调用API"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]

        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        # 记录Token使用
        usage = response.usage
        self.token_stats["call_count"] += 1
        self.token_stats["input_tokens"] += usage.prompt_tokens
        self.token_stats["output_tokens"] += usage.completion_tokens
        self.token_stats["total_tokens"] += usage.total_tokens

        # 记录用户使用
        await self._record_user_usage(user_id, usage)

        return response.choices[0].message.content

    async def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """解析JSON响应"""
        try:
            import re
            response = re.sub(r'```json\n?', '', response)
            response = re.sub(r'```', '', response)
            response = response.strip()

            data = json.loads(response)
            return data
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {str(e)}")
            raise Exception("无法解析AI返回的JSON数据")

    async def _get_daily_usage(self) -> Dict[str, Any]:
        """获取今日使用量"""
        # 实际应该从缓存或数据库获取
        return {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "cost": 0.0
        }

    async def _get_user_usage(self, user_id: str) -> Dict[str, Any]:
        """获取用户使用量"""
        # 实际应该从缓存或数据库获取
        return {
            "total_tokens": 0,
            "request_count": 0
        }

    async def _record_user_usage(self, user_id: str, usage: Any):
        """记录用户使用量"""
        # 实际应该写入缓存或数据库
        pass

    def get_token_stats(self) -> Dict[str, Any]:
        """获取Token使用统计"""
        return {
            **self.token_stats,
            "estimated_cost": self._estimate_cost()
        }

    def _estimate_cost(self) -> float:
        """估算成本(元)"""
        input_cost = self.token_stats["input_tokens"] / 1000 * 0.01
        output_cost = self.token_stats["output_tokens"] / 1000 * 0.04
        return input_cost + output_cost


# 全局实例
glm_service_v2 = GLMServiceV2()