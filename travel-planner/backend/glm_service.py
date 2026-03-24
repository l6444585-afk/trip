from zhipuai import ZhipuAI
from typing import Dict, List, Optional
import json
import os
import asyncio
import time
from functools import wraps
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def retry_on_failure(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """
    重试装饰器，用于API调用失败时自动重试
    
    Args:
        max_retries: 最大重试次数
        delay: 初始延迟时间（秒）
        backoff: 延迟时间增长因子
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            current_delay = delay
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        logger.warning(
                            f"[GLMService] {func.__name__} 调用失败 (尝试 {attempt + 1}/{max_retries + 1}): {str(e)}"
                        )
                        logger.info(f"[GLMService] 等待 {current_delay:.1f} 秒后重试...")
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(
                            f"[GLMService] {func.__name__} 调用失败，已达到最大重试次数 ({max_retries + 1})"
                        )
            
            raise last_exception
        return wrapper
    return decorator


class GLMService:
    _instance = None
    _health_status = None
    _last_health_check = 0
    _health_check_interval = 300  # 5分钟检查一次
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        self.api_key = os.getenv("GLM_API_KEY")
        self.model = os.getenv("GLM_MODEL", "glm-4-flash")
        self.timeout = int(os.getenv("GLM_TIMEOUT", "25"))
        
        if not self.api_key:
            logger.warning("[GLMService] GLM_API_KEY 未配置，AI服务将不可用")
            self.client = None
            self._available = False
        else:
            try:
                self.client = ZhipuAI(api_key=self.api_key)
                self._available = True
                logger.info(f"[GLMService] 初始化成功，模型: {self.model}")
            except Exception as e:
                logger.error(f"[GLMService] 初始化失败: {str(e)}")
                self.client = None
                self._available = False
    
    @property
    def is_available(self) -> bool:
        """检查服务是否可用"""
        return self._available and self.client is not None
    
    async def health_check(self) -> Dict:
        """
        健康检查：验证API是否可用
        
        Returns:
            Dict: 包含状态、延迟、错误信息等
        """
        current_time = time.time()
        
        if (self._health_status is not None and 
            current_time - self._last_health_check < self._health_check_interval):
            return self._health_status
        
        if not self.is_available:
            self._health_status = {
                "status": "unavailable",
                "available": False,
                "message": "GLM API 未配置或初始化失败",
                "timestamp": datetime.now().isoformat()
            }
            return self._health_status
        
        start_time = time.time()
        
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": "你好"}],
                    max_tokens=10,
                    temperature=0.1
                )
            )
            
            latency = time.time() - start_time
            
            if response and response.choices:
                self._health_status = {
                    "status": "healthy",
                    "available": True,
                    "latency": round(latency, 3),
                    "model": self.model,
                    "message": "API 正常运行",
                    "timestamp": datetime.now().isoformat()
                }
                self._last_health_check = current_time
                logger.info(f"[GLMService] 健康检查通过，延迟: {latency:.3f}s")
            else:
                raise Exception("响应格式异常")
                
        except Exception as e:
            latency = time.time() - start_time
            self._health_status = {
                "status": "unhealthy",
                "available": False,
                "latency": round(latency, 3),
                "error": str(e),
                "message": f"API 调用失败: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            logger.error(f"[GLMService] 健康检查失败: {str(e)}")
        
        return self._health_status
    
    @retry_on_failure(max_retries=0, delay=1.0, backoff=2.0)
    async def _call_api(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 4000) -> str:
        """
        调用智谱API，带重试机制
        
        Args:
            messages: 消息列表
            temperature: 温度参数
            max_tokens: 最大token数
            
        Returns:
            str: API响应内容
        """
        if not self.is_available:
            raise Exception("GLM API 服务不可用，请检查 API Key 配置")
        
        loop = asyncio.get_event_loop()
        
        response = await loop.run_in_executor(
            None,
            lambda: self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
        )
        
        return response.choices[0].message.content
    
    @retry_on_failure(max_retries=0, delay=1.0, backoff=1.0)
    async def generate_itinerary(
        self,
        days: int,
        budget: float,
        departure: str,
        companion_type: str,
        interests: List[str],
        destinations: Optional[List[str]] = None,
        travel_style: Optional[str] = "精品深度",
        travel_mode: Optional[str] = "公共交通",
        age_group: Optional[str] = "成年人",
        pace_preference: Optional[str] = "适中",
        special_needs: Optional[List[str]] = None,
        date_range: Optional[List[str]] = None
    ) -> Dict:
        if not self.is_available:
            raise Exception("GLM API 服务不可用，请检查 API Key 配置")
        
        prompt = self._build_prompt(
            days, budget, departure, companion_type, interests,
            destinations, travel_style, travel_mode, age_group,
            pace_preference, special_needs, date_range
        )
        
        messages = [
            {"role": "system", "content": self._get_system_prompt()},
            {"role": "user", "content": prompt}
        ]
        
        content = await self._call_api(messages, temperature=0.7, max_tokens=4000)
        return self._parse_response(content)
    
    @retry_on_failure(max_retries=2, delay=2.0, backoff=2.0)
    async def generate_multiple_itineraries(
        self,
        days: int,
        budget: float,
        departure: str,
        companion_type: str,
        interests: List[str],
        destinations: Optional[List[str]] = None,
        travel_style: Optional[str] = "精品深度",
        travel_mode: Optional[str] = "公共交通",
        age_group: Optional[str] = "成年人",
        pace_preference: Optional[str] = "适中",
        special_needs: Optional[List[str]] = None,
        date_range: Optional[List[str]] = None
    ) -> Dict:
        if not self.is_available:
            raise Exception("GLM API 服务不可用，请检查 API Key 配置")
        
        prompt = self._build_multi_plan_prompt(
            days, budget, departure, companion_type, interests,
            destinations, travel_style, travel_mode, age_group,
            pace_preference, special_needs, date_range
        )
        
        messages = [
            {"role": "system", "content": self._get_system_prompt()},
            {"role": "user", "content": prompt}
        ]
        
        content = await self._call_api(messages, temperature=0.8, max_tokens=6000)
        return self._parse_response(content)
    
    def _build_multi_plan_prompt(
        self,
        days: int,
        budget: float,
        departure: str,
        companion_type: str,
        interests: List[str],
        destinations: Optional[List[str]] = None,
        travel_style: Optional[str] = "精品深度",
        travel_mode: Optional[str] = "公共交通",
        age_group: Optional[str] = "成年人",
        pace_preference: Optional[str] = "适中",
        special_needs: Optional[List[str]] = None,
        date_range: Optional[List[str]] = None
    ) -> str:
        destinations_str = "、".join(destinations) if destinations else "江浙沪地区任意推荐"
        date_str = f"{date_range[0]} 至 {date_range[1]}" if date_range and len(date_range) >= 2 else "未指定具体日期"
        
        return f"""【用户需求 JSON】
{{
  "出发城市": "{departure}",
  "目的地城市": ["{destinations_str}"],
  "出行日期": "{date_str}",
  "出行天数": {days},
  "出行人数": "按{companion_type}计算",
  "人群构成": "{age_group}，{companion_type}",
  "出行方式": "{travel_mode}",
  "预算上限": "{budget}元（不含大交通）",
  "兴趣偏好": {json.dumps(interests, ensure_ascii=False)},
  "旅行风格": "{travel_style}",
  "节奏偏好": "{pace_preference}",
  "特殊需求": {json.dumps(special_needs, ensure_ascii=False)}
}}

【核心任务】
请为用户生成3个不同侧重点的行程方案，供用户对比选择：
- 方案A：省钱版（预算优先，性价比最高）
- 方案B：轻松版（体力优先，节奏舒适）
- 方案C：深度体验版（体验优先，文化深度）

【输出格式要求】
请严格按照以下JSON结构输出：

{{
  "plans_comparison": {{
    "summary_table": [
      {{
        "plan": "方案A：省钱版",
        "total_cost": 0,
        "daily_intensity": "紧凑/适中/轻松",
        "highlights": ["亮点1", "亮点2"],
        "best_for": "适合预算有限、想多看景点的游客"
      }},
      {{
        "plan": "方案B：轻松版",
        "total_cost": 0,
        "daily_intensity": "轻松",
        "highlights": ["亮点1", "亮点2"],
        "best_for": "适合带老人小孩、追求舒适体验的游客"
      }},
      {{
        "plan": "方案C：深度体验版",
        "total_cost": 0,
        "daily_intensity": "适中",
        "highlights": ["亮点1", "亮点2"],
        "best_for": "适合文化爱好者、追求深度体验的游客"
      }}
    ]
  }},
  "plans": {{
    "plan_a": {{
      "title": "省钱版行程",
      "focus": "预算优先",
      "total_budget_estimate": {{
        "transport": 0,
        "tickets": 0,
        "dining": 0,
        "accommodation": 0,
        "total": 0
      }},
      "daily_plans": [
        {{
          "day": 1,
          "theme": "当日主题",
          "city": "所在城市",
          "morning": {{
            "time": "08:00-12:00",
            "activities": [
              {{
                "type": "景点",
                "name": "名称",
                "location": "地址",
                "latitude": 0.0,
                "longitude": 0.0,
                "duration_minutes": 120,
                "cost": 0,
                "tips": "温馨提示"
              }}
            ]
          }},
          "lunch": {{
            "recommendation": {{
              "name": "餐厅名称",
              "average_cost": 50,
              "cuisine": "菜系"
            }}
          }},
          "afternoon": {{
            "time": "14:00-17:00",
            "activities": []
          }},
          "dinner": {{
            "recommendation": {{
              "name": "餐厅名称",
              "average_cost": 60
            }}
          }},
          "accommodation": {{
            "recommended_area": "推荐区域",
            "price_range": "150-250元/晚"
          }}
        }}
      ],
      "risk_alerts": {{
        "weather": [],
        "reservation": [],
        "holiday_notes": []
      }}
    }},
    "plan_b": {{
      "title": "轻松版行程",
      "focus": "体力优先",
      "total_budget_estimate": {{}},
      "daily_plans": []
    }},
    "plan_c": {{
      "title": "深度体验版行程",
      "focus": "体验优先",
      "total_budget_estimate": {{}},
      "daily_plans": []
    }}
  }},
  "recommendation": {{
    "default_choice": "方案B",
    "reason": "根据您的需求分析，推荐方案B因为..."
  }}
}}

【数据与真实性要求】
1. 请使用真实存在的景点、餐厅
2. 门票价格、餐厅人均请尽量准确
3. 经纬度坐标请尽量准确"""
    
    def _get_system_prompt(self) -> str:
        return """你是一个面向江浙沪地区的智能旅游行程规划系统，具备以下能力：

【系统角色】
1. 需求理解：将自然语言需求转化为结构化用户画像
2. 行程优化：基于多目标（时间、费用、体验、疲劳度）和约束条件，生成合理的行程安排
3. 内容生成：为每一天生成详细行程，包含景点、餐饮、住宿、交通和注意事项
4. 风险提示：结合季节、节假日、人流、天气等因素给出提醒
5. 方案对比：在必要时提供多个可选方案供用户选择

【目标】
- 保证行程在时间、费用、体力上的可行性
- 提升体验：避免走回头路、避免景点过于集中或分散
- 提供可落地的预订建议和实时风险提示

请严格按照JSON格式输出行程规划。"""
    
    def _build_prompt(
        self,
        days: int,
        budget: float,
        departure: str,
        companion_type: str,
        interests: List[str],
        destinations: Optional[List[str]] = None,
        travel_style: Optional[str] = "精品深度",
        travel_mode: Optional[str] = "公共交通",
        age_group: Optional[str] = "成年人",
        pace_preference: Optional[str] = "适中",
        special_needs: Optional[List[str]] = None,
        date_range: Optional[List[str]] = None
    ) -> str:
        destinations_str = "、".join(destinations) if destinations else "江浙沪地区任意推荐"
        special_needs_str = "、".join(special_needs) if special_needs else "无"
        date_str = f"{date_range[0]} 至 {date_range[1]}" if date_range and len(date_range) >= 2 else "未指定具体日期"
        
        return f"""【用户需求 JSON】
{{
  "出发城市": "{departure}",
  "目的地城市": ["{destinations_str}"],
  "出行日期": "{date_str}",
  "出行天数": {days},
  "出行人数": "按{companion_type}计算",
  "人群构成": "{age_group}，{companion_type}",
  "出行方式": "{travel_mode}",
  "预算上限": "{budget}元（不含大交通）",
  "兴趣偏好": {json.dumps(interests, ensure_ascii=False)},
  "旅行风格": "{travel_style}",
  "节奏偏好": "{pace_preference}",
  "特殊需求": {json.dumps(special_needs, ensure_ascii=False)}
}}

【核心任务】
根据上述用户需求，生成一份"江浙沪旅游行程规划方案"。

【多目标优化要求】
目标：在满足用户约束的前提下，尽量：
a) 最小化总时间和总花费
b) 最大化景点满意度（按兴趣标签匹配和景点评分）
c) 最小化疲劳度（避免连续多天高强度行程）

【约束条件】
- 总天数：<= {days}天
- 每天游玩时长：建议不超过8小时（含景点间交通），节奏偏好为"{pace_preference}"
- 预算：尽量控制在{budget}元以内，若接近上限请提前预警
- 交通：根据"{travel_mode}"选择合适交通方式，并计算交通时间
- 体力：考虑"{age_group}"和"{companion_type}"合理安排步行强度和休息时间
- 区域划分：优先减少跨城市奔波，优先安排同一区域的景点在同一天游玩

【输出格式要求】
请严格按照以下JSON结构输出：

{{
  "itinerary": {{
    "title": "行程标题",
    "summary": "行程概述（包含总预算估算、主要城市、交通方式概要）",
    "total_budget_estimate": {{
      "transport": 0,
      "tickets": 0,
      "dining": 0,
      "accommodation": 0,
      "total": 0
    }},
    "daily_plans": [
      {{
        "day": 1,
        "date": "日期",
        "theme": "当日主题",
        "city": "所在城市",
        "morning": {{
          "time": "08:00-12:00",
          "activities": [
            {{
              "type": "景点/交通/餐饮",
              "name": "名称",
              "description": "描述",
              "location": "详细地址",
              "latitude": 0.0,
              "longitude": 0.0,
              "duration_minutes": 120,
              "cost": 0,
              "tips": "温馨提示",
              "reservation_required": false,
              "reservation_note": "预约说明"
            }}
          ]
        }},
        "lunch": {{
          "time": "12:00-13:30",
          "recommendation": {{
            "name": "餐厅名称",
            "cuisine": "菜系",
            "average_cost": 80,
            "location": "地址",
            "latitude": 0.0,
            "longitude": 0.0,
            "reservation_required": false,
            "special_dishes": ["招牌菜1", "招牌菜2"],
            "tips": "用餐建议"
          }}
        }},
        "afternoon": {{
          "time": "14:00-17:00",
          "activities": [
            {{
              "type": "景点",
              "name": "名称",
              "description": "描述",
              "location": "地址",
              "latitude": 0.0,
              "longitude": 0.0,
              "duration_minutes": 180,
              "cost": 0,
              "tips": "温馨提示",
              "reservation_required": false,
              "reservation_note": ""
            }}
          ]
        }},
        "dinner": {{
          "time": "18:00-20:00",
          "recommendation": {{
            "name": "餐厅名称",
            "cuisine": "菜系",
            "average_cost": 100,
            "location": "地址",
            "latitude": 0.0,
            "longitude": 0.0,
            "reservation_required": false,
            "special_dishes": [],
            "tips": ""
          }}
        }},
        "evening": {{
          "time": "20:00-22:00",
          "activity": {{
            "name": "夜景/演出/休闲活动",
            "description": "描述",
            "location": "地址",
            "latitude": 0.0,
            "longitude": 0.0,
            "cost": 0,
            "tips": ""
          }}
        }},
        "accommodation": {{
          "recommended_area": "推荐住宿区域",
          "hotel_type": "经济型/舒适型/高档",
          "price_range": "200-400元/晚",
          "reasons": ["选择理由1", "选择理由2"],
          "specific_recommendations": [
            {{
              "name": "酒店名称",
              "type": "酒店类型",
              "price_per_night": 300,
              "location": "地址",
              "latitude": 0.0,
              "longitude": 0.0,
              "rating": 4.5,
              "highlights": ["亮点1", "亮点2"]
            }}
          ]
        }},
        "daily_transport": {{
          "main_mode": "地铁/公交/打车/步行",
          "estimated_cost": 50,
          "routes": [
            {{
              "from": "起点",
              "to": "终点",
              "mode": "交通方式",
              "duration_minutes": 30,
              "cost": 5,
              "tips": "交通提示"
            }}
          ]
        }},
        "daily_budget": {{
          "transport": 0,
          "tickets": 0,
          "dining": 0,
          "total": 0
        }}
      }}
    ],
    "risk_alerts": {{
      "weather": ["天气相关提醒"],
      "reservation": ["需要提前预约的景点/餐厅"],
      "holiday_notes": ["节假日注意事项"],
      "seasonal_tips": ["季节性建议"],
      "physical_demand": "体力要求评估"
    }},
    "optimization_notes": {{
      "focus": "本次行程优化侧重（省钱/轻松/深度文化等）",
      "trade_offs": ["权衡说明"],
      "alternatives": ["备选方案建议"]
    }},
    "packing_suggestions": ["行李打包建议"],
    "important_reminders": [
      "出发前1-2天再次确认开放时间和预约情况",
      "若遇到天气突变或景点临时关闭，建议备选方案"
    ]
  }}
}}

【数据与真实性要求】
1. 请使用真实存在的景点、餐厅和交通方式
2. 若不确定某个信息（如门票价格是否变动），请用【建议以官方渠道为准】标注
3. 对于热门景点，请提示是否需要提前预约、是否有客流限制
4. 门票价格、餐厅人均请尽量准确，参考江浙沪地区实际情况
5. 经纬度坐标请尽量准确，用于地图展示"""
    
    def _parse_response(self, content: str) -> Dict:
        """解析GLM返回的JSON响应，增强错误处理和日志记录"""
        import re
        
        try:
            content = content.strip()
            
            if logger.isEnabledFor(logging.DEBUG):
                logger.debug(f"[GLMService] Raw response length: {len(content)} chars")
            
            if content.startswith("```json"):
                content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
            elif content.startswith("```"):
                content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
            
            content = content.strip()
            
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    try:
                        return json.loads(json_match.group())
                    except json.JSONDecodeError:
                        pass
                
                content = re.sub(r',(\s*[}\]])', r'\1', content)
                content = content.replace("'", '"')
                
                try:
                    return json.loads(content)
                except json.JSONDecodeError as e:
                    logger.error(f"[GLMService] JSON parse error: {str(e)}")
                    raise Exception(f"GLM 返回的 JSON 格式不正确: {str(e)}")
                    
        except Exception as e:
            if "GLM 返回的 JSON 格式不正确" in str(e):
                raise
            raise Exception(f"解析 GLM 响应时发生错误: {str(e)}")
    
    @retry_on_failure(max_retries=2, delay=1.0, backoff=2.0)
    async def chat_with_context(
        self,
        question: str,
        context: str,
        chat_history: Optional[List[Dict]] = None
    ) -> str:
        if not self.is_available:
            raise Exception("GLM API 服务不可用，请检查 API Key 配置")
        
        system_prompt = f"""你是一位专业的旅游顾问，基于以下行程上下文回答用户的问题：

行程上下文：
{context}

请提供准确、实用的建议。如果问题与当前行程无关，请礼貌地引导用户回到行程相关话题。"""

        messages = [{"role": "system", "content": system_prompt}]
        
        if chat_history:
            messages.extend(chat_history)
        
        messages.append({"role": "user", "content": question})
        
        return await self._call_api(messages, temperature=0.7, max_tokens=500)
