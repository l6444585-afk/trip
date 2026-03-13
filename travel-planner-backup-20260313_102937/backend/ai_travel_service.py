import httpx
from typing import Dict, List, Optional, Generator
import json
import os
import time
import hashlib
from datetime import datetime
from pydantic import BaseModel
import logging
import asyncio
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

AI_TRAVEL_SYSTEM_PROMPT = """# 角色定位
你是"江浙沪智能旅游规划专家"，由资深旅游规划团队训练而成。你精通江苏、浙江、上海三地的：
- 500+热门景点与小众秘境
- 各城市交通网络（高铁/地铁/自驾路线）
- 当地特色美食与避坑指南
- 各季节最佳游玩方案
- 不同人群的定制策略（亲子/情侣/家庭/独行/团建）

# 核心使命
通过自然对话，深度理解用户需求，生成专业、可执行、个性化的旅游规划方案。

# 对话策略
## 第一阶段：需求收集（首次对话）
主动询问但不生硬，像朋友聊天一样获取信息：
- 出发城市 → "从哪里出发呢？"
- 目的地偏好 → "想去海边、古镇、山水还是城市游？"
- 出行天数 → "计划玩几天呢？"
- 同行人员 → "和谁一起去？朋友、家人还是情侣？"
- 预算范围 → "大概预算多少？是穷游还是舒适游？"
- 特殊需求 → "有什么特别想体验的吗？摄影、美食、户外？"

## 第二阶段：智能推荐
根据收集的信息，快速生成2-3个不同风格的方案供选择：
- 方案A：经典热门路线
- 方案B：小众深度体验
- 方案C：性价比最优

## 第三阶段：深度规划
用户确认后，生成详细日程安排：
- 精确到小时的时间规划
- 交通方式与预计耗时
- 景点亮点与拍照机位
- 餐饮住宿推荐
- 实时Tips（天气/门票预约/注意事项）

# 输出格式规范
根据用户意图智能选择输出格式：

## 格式1：快速推荐（用户问"有什么推荐？"）
使用简洁列表：
🎯 推荐【目的地名】
📍 亮点：xxx
⏰ 建议天数：x天
💰 预算：人均约xxx元
✨ 推荐理由：xxx

## 格式2：详细规划（用户要求"生成行程/规划路线"）
【行程主题】xxx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 行程概览
• 天数：x天x晚
• 预算：人均约xxx元
• 最佳季节：xxx
• 交通方式：xxx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📑 详细行程

📍 Day 1：xxx
🕘 09:00-12:00 | 🏛️ 景点名
   📍 地址：xxx
   💡 亮点：xxx
   ⏱️ 建议游玩：x小时
   📷 拍照机位：xxx
   
🕘 12:00-13:30 | 🍜 午餐推荐
   🍽️ 餐厅：xxx
   💰 人均：xxx元
   🥢 必点：xxx

🕘 14:00-17:00 | 🏛️ 景点名
   （同上格式）

🚇 交通提示：xxx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 实用攻略
📦 必带物品
• xxx
• xxx

⚠️ 避坑指南
• xxx

📱 实用信息
• 天气：xxx
• 门票预约：xxx
• 交通卡：xxx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 格式3：JSON结构化输出（系统调用时）
当用户说"导出行程"或系统检测到需要保存时，输出：
```json
{
  "trip_id": "自动生成",
  "title": "行程标题",
  "total_days": 3,
  "budget_per_person": 1500,
  "destinations": ["城市1", "城市2"],
  "itinerary": [
    {
      "day": 1,
      "date": "可选",
      "theme": "主题",
      "activities": [
        {
          "time": "09:00-12:00",
          "type": "attraction/meal/accommodation/transport",
          "name": "名称",
          "location": "地址",
          "description": "描述",
          "cost": 100,
          "duration_minutes": 180,
          "booking_required": true,
          "tips": "注意事项"
        }
      ]
    }
  ],
  "practical_info": {
    "packing_list": ["物品1", "物品2"],
    "weather_tips": "天气建议",
    "traffic_tips": "交通建议",
    "booking_reminders": ["预约事项"]
  }
}
```

# 知识增强
## 江浙沪热门目的地速查
- 上海：外滩、迪士尼、豫园、武康路
- 杭州：西湖、灵隐寺、宋城、西溪湿地
- 苏州：拙政园、虎丘、平江路、金鸡湖
- 南京：夫子庙、中山陵、玄武湖、总统府
- 无锡：太湖、灵山、鼋头渚
- 嘉兴：乌镇、西塘、南湖
- 舟山：普陀山、朱家尖

## 季节推荐
- 春季（3-5月）：赏花、古镇、茶园
- 夏季（6-8月）：避暑、海岛、水上乐园
- 秋季（9-11月）：赏枫、登高、美食
- 冬季（12-2月）：温泉、年味、室内景点

## 人群偏好
- 情侣：浪漫景点、网红打卡、特色餐厅
- 家庭：亲子乐园、自然风光、教育景点
- 独行：小众秘境、文艺书店、咖啡馆
- 团建：户外拓展、农家乐、团队游戏

# 异常处理
- 超出江浙沪范围：友好提示"我主要专注于江浙沪地区，但可以给您一些通用建议"
- 预算不合理：给出合理范围建议
- 时间不足：推荐精华景点或建议延长行程

# 语言风格
- 自然亲切，像朋友一样对话
- 使用表情符号增加亲和力
- 专业但不生硬
- 主动提供有价值的信息"""

class ConversationSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.messages: List[Dict] = []
        self.context: Dict = {
            "departure": None,
            "destination": None,
            "days": None,
            "people": None,
            "budget": None,
            "preferences": [],
            "stage": "collecting"
        }
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def add_message(self, role: str, content: str):
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        self.updated_at = datetime.now()
    
    def get_history(self, max_turns: int = 10) -> List[Dict]:
        return self.messages[-max_turns * 2:] if len(self.messages) > max_turns * 2 else self.messages


class AITravelService:
    def __init__(self):
        self.glm_api_key = os.getenv("GLM_API_KEY")
        self.glm_model = os.getenv("GLM_MODEL", "glm-4-flash")
        
        self.siliconflow_api_key = os.getenv("SILICONFLOW_API_KEY")
        self.siliconflow_base_url = os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
        self.siliconflow_model = os.getenv("SILICONFLOW_MODEL", "Qwen/Qwen2.5-7B-Instruct")
        
        if self.glm_api_key and self.glm_api_key != "your_glm_api_key_here":
            self.provider = "zhipu"
            logger.info(f"AI Travel Service initialized with ZhipuAI, model: {self.glm_model}")
        elif self.siliconflow_api_key and self.siliconflow_api_key != "your_siliconflow_api_key_here":
            self.provider = "siliconflow"
            logger.info(f"AI Travel Service initialized with SiliconFlow, model: {self.siliconflow_model}")
        else:
            self.provider = "mock"
            logger.warning("No valid API key configured, using mock responses")
        
        self.sessions: Dict[str, ConversationSession] = {}
        self.max_tokens = 4000
        self.temperature = 0.7
        
        if self.provider == "zhipu":
            try:
                from zhipuai import ZhipuAI
                self.zhipu_client = ZhipuAI(api_key=self.glm_api_key)
            except ImportError:
                logger.warning("zhipuai not installed, falling back to mock")
                self.provider = "mock"
    
    def get_or_create_session(self, user_id: str) -> ConversationSession:
        if user_id not in self.sessions:
            self.sessions[user_id] = ConversationSession(user_id)
        return self.sessions[user_id]
    
    def clear_session(self, user_id: str):
        if user_id in self.sessions:
            del self.sessions[user_id]
    
    async def chat(
        self,
        user_id: str,
        message: str,
        stream: bool = False
    ) -> Dict:
        session = self.get_or_create_session(user_id)
        session.add_message("user", message)
        
        messages = self._build_messages(session)
        
        if self.provider == "mock":
            response = self._mock_response(message, session)
            session.add_message("assistant", response)
            return {
                "content": response,
                "stream": False,
                "context": session.context
            }
        
        try:
            if self.provider == "zhipu":
                response = await self._call_zhipu_api(messages)
            else:
                response = await self._call_siliconflow_api(messages)
            
            content = response.get("content", "")
            session.add_message("assistant", content)
            self._update_context(session, message, content)
            
            return {
                "content": content,
                "stream": False,
                "context": session.context,
                "usage": response.get("usage")
            }
        except Exception as e:
            logger.error(f"API error: {str(e)}")
            error_response = f"抱歉，AI服务暂时不可用。请稍后再试。错误信息：{str(e)}"
            session.add_message("assistant", error_response)
            return {
                "content": error_response,
                "stream": False,
                "error": str(e)
            }
    
    async def _call_zhipu_api(self, messages: List[Dict]) -> Dict:
        try:
            response = await asyncio.to_thread(
                self.zhipu_client.chat.completions.create,
                model=self.glm_model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            return {
                "content": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        except Exception as e:
            logger.error(f"ZhipuAI API error: {str(e)}")
            raise
    
    async def _call_siliconflow_api(self, messages: List[Dict]) -> Dict:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.siliconflow_api_key}"
        }
        
        payload = {
            "model": self.siliconflow_model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.siliconflow_base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                raise Exception(f"API returned status {response.status_code}: {response.text}")
            
            data = response.json()
            
            return {
                "content": data["choices"][0]["message"]["content"],
                "usage": data.get("usage", {})
            }
    
    def _build_messages(self, session: ConversationSession) -> List[Dict]:
        messages = [
            {"role": "system", "content": AI_TRAVEL_SYSTEM_PROMPT}
        ]
        
        history = session.get_history(max_turns=10)
        for msg in history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        return messages
    
    def _update_context(self, session: ConversationSession, user_message: str, ai_response: str):
        message_lower = user_message.lower()
        
        cities = ["上海", "杭州", "苏州", "南京", "无锡", "宁波", "嘉兴", "舟山", "绍兴", "常州", "扬州", "镇江"]
        for city in cities:
            if city in user_message and not session.context.get("departure"):
                session.context["departure"] = city
                break
        
        for city in cities:
            if city in user_message and city != session.context.get("departure"):
                if not session.context.get("destination"):
                    session.context["destination"] = city
                break
        
        import re
        day_match = re.search(r'(\d+)\s*[天日]', user_message)
        if day_match:
            session.context["days"] = int(day_match.group(1))
        
        budget_match = re.search(r'(\d+)[元块]', user_message)
        if budget_match:
            session.context["budget"] = int(budget_match.group(1))
        
        companions = ["情侣", "朋友", "家人", "父母", "孩子", "小孩", "老人", "独自", "一个人"]
        for companion in companions:
            if companion in user_message:
                session.context["people"] = companion
                break
        
        preferences = ["自然风光", "历史文化", "美食", "购物", "摄影", "古镇", "海边", "山水", "城市"]
        for pref in preferences:
            if pref in user_message and pref not in session.context["preferences"]:
                session.context["preferences"].append(pref)
        
        if session.context.get("destination") and session.context.get("days"):
            session.context["stage"] = "planning"
    
    def _mock_response(self, message: str, session: ConversationSession) -> str:
        if any(greeting in message for greeting in ["你好", "您好", "hi", "hello"]):
            return """你好！我是江浙沪旅游规划专家 🌟

我可以帮你规划：
🏞️ 自然风光游
🏯 古镇文化游
🎢 主题乐园游
📸 小众摄影游

请告诉我：
• 从哪个城市出发？
• 计划玩几天？
• 和谁一起去？"""
        
        if "推荐" in message or "去哪" in message:
            return """🎯 根据您的需求，推荐以下目的地：

**杭州西湖** ⭐⭐⭐⭐⭐
📍 亮点：断桥残雪、苏堤春晓、雷峰夕照
⏰ 建议天数：2-3天
💰 预算：人均约800-1500元
✨ 推荐理由：四季皆宜，适合各类人群

**苏州园林** ⭐⭐⭐⭐⭐
📍 亮点：拙政园、留园、平江路
⏰ 建议天数：2天
💰 预算：人均约600-1200元
✨ 推荐理由：江南水乡韵味，适合情侣和家庭

需要我为您生成详细的行程规划吗？"""
        
        return """我理解您的需求了！让我为您规划一个完美的江浙沪之旅。

请告诉我：
1. 您从哪个城市出发？
2. 计划玩几天？
3. 大概预算是多少？
4. 和谁一起出行？

有了这些信息，我可以为您生成专属的行程方案！✨"""
    
    async def generate_itinerary(
        self,
        user_id: str,
        departure: str,
        destination: str,
        days: int,
        budget: float,
        companion_type: str,
        interests: List[str],
        travel_mode: str = "公共交通",
        pace: str = "适中"
    ) -> Dict:
        session = self.get_or_create_session(user_id)
        
        prompt = f"""请为以下需求生成详细的JSON格式行程规划：

出发城市：{departure}
目的地：{destination}
天数：{days}天
预算：{budget}元
同行人员：{companion_type}
兴趣偏好：{', '.join(interests)}
交通方式：{travel_mode}
节奏偏好：{pace}

请严格按照JSON格式输出完整的行程规划。"""
        
        session.add_message("user", prompt)
        messages = self._build_messages(session)
        
        if self.provider == "mock":
            return self._mock_itinerary(departure, destination, days, budget)
        
        try:
            if self.provider == "zhipu":
                response = await self._call_zhipu_api(messages)
            else:
                response = await self._call_siliconflow_api(messages)
            
            content = response.get("content", "")
            session.add_message("assistant", content)
            
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                return json.loads(content.strip())
            except json.JSONDecodeError:
                return {"raw_content": content, "error": "JSON解析失败"}
                
        except Exception as e:
            logger.error(f"Generate itinerary error: {str(e)}")
            return {"error": str(e)}
    
    def _mock_itinerary(self, departure: str, destination: str, days: int, budget: float) -> Dict:
        return {
            "trip_id": f"trip_{int(time.time())}",
            "title": f"{departure}出发{destination}{days}日游",
            "total_days": days,
            "budget_per_person": budget,
            "destinations": [destination],
            "itinerary": [
                {
                    "day": i + 1,
                    "theme": f"第{i+1}天探索",
                    "activities": [
                        {
                            "time": "09:00-12:00",
                            "type": "attraction",
                            "name": f"{destination}热门景点{i+1}",
                            "location": f"{destination}市中心",
                            "description": "精彩景点等待您的探索",
                            "cost": 100,
                            "duration_minutes": 180,
                            "booking_required": False,
                            "tips": "建议提前预约"
                        },
                        {
                            "time": "12:00-13:30",
                            "type": "meal",
                            "name": "当地特色餐厅",
                            "location": "美食街",
                            "description": "品尝当地美食",
                            "cost": 80,
                            "duration_minutes": 90,
                            "booking_required": False,
                            "tips": "推荐招牌菜"
                        }
                    ]
                } for i in range(days)
            ],
            "practical_info": {
                "packing_list": ["身份证", "充电宝", "雨伞", "舒适鞋子"],
                "weather_tips": "出行前请查看天气预报",
                "traffic_tips": "建议使用公共交通",
                "booking_reminders": ["热门景点需提前预约"]
            }
        }
    
    def get_context(self, user_id: str) -> Dict:
        session = self.get_or_create_session(user_id)
        return session.context
    
    def get_history(self, user_id: str) -> List[Dict]:
        session = self.get_or_create_session(user_id)
        return session.messages


ai_travel_service = AITravelService()
