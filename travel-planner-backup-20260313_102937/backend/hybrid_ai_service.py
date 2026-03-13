"""
混合 AI 行程规划服务
分离意图理解、算法排序、内容润色三个阶段
"""
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Attraction, City, UserPreference
from itinerary_planner import ItineraryPlanner, ItineraryOptimizer
import json
import os
from zhipuai import ZhipuAI

class HybridItineraryService:
    def __init__(self, db: Session):
        self.db = db
        self.planner = ItineraryPlanner(db)
        self.optimizer = ItineraryOptimizer(self.planner)
        self.llm_client = ZhipuAI(api_key=os.getenv("GLM_API_KEY"))
    
    async def parse_user_intent(self, user_input: str) -> Dict:
        system_prompt = """你是一个旅游参数提取引擎。请从用户的输入中提取以下参数，并以 JSON 格式输出。
如果用户未提及，请根据"江浙沪"默认常识进行推测或设为 null。

输出格式：
{
  "departure": "出发城市",
  "destinations": ["目的地城市列表"],
  "days": 出行天数(整数),
  "budget": 预算上限(数字，单位元),
  "budget_level": "预算等级(low/medium/high)",
  "pace": "行程节奏(relaxed/normal/tight)",
  "companions": "出行类型(solo/couple/family_with_kids/friends/elderly)",
  "interests": ["兴趣标签列表"],
  "constraints": ["约束条件列表"],
  "special_needs": ["特殊需求列表"],
  "age_group": "年龄段",
  "travel_mode": "交通方式偏好"
}

仅输出 JSON，不要包含其他解释。"""

        try:
            response = self.llm_client.chat.completions.create(
                model="glm-4-flash",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            return json.loads(content)
        except Exception as e:
            print(f"意图解析失败: {e}")
            return self._default_intent()
    
    def _default_intent(self) -> Dict:
        return {
            "departure": "上海",
            "destinations": ["杭州"],
            "days": 2,
            "budget": 2000,
            "budget_level": "medium",
            "pace": "normal",
            "companions": "couple",
            "interests": ["自然风光", "历史文化"],
            "constraints": [],
            "special_needs": [],
            "age_group": "成年人",
            "travel_mode": "公共交通"
        }
    
    def get_candidate_attractions(
        self,
        destinations: List[str],
        interests: List[str],
        companions: str,
        budget: float,
        days: int
    ) -> List[Attraction]:
        query = self.db.query(Attraction)
        
        if destinations:
            query = query.filter(Attraction.city.in_(destinations))
        
        attractions = query.all()
        
        if interests:
            def interest_score(attr: Attraction) -> float:
                tags = (attr.tags or "").lower()
                score = attr.rating
                for interest in interests:
                    if interest.lower() in tags:
                        score += 0.5
                return score
            attractions = sorted(attractions, key=interest_score, reverse=True)
        
        attractions = self.optimizer.optimize_for_companion(attractions, self._map_companion_type(companions))
        
        max_attractions = days * 4
        attractions = attractions[:max_attractions]
        
        attractions = self.optimizer.optimize_for_cost(attractions, budget / days * 0.3)
        
        return attractions
    
    def _map_companion_type(self, companions: str) -> str:
        mapping = {
            "solo": "独行",
            "couple": "情侣",
            "family_with_kids": "亲子",
            "friends": "朋友",
            "elderly": "家庭"
        }
        return mapping.get(companions, "朋友")
    
    def generate_optimized_itinerary(
        self,
        intent: Dict,
        start_date: Optional[datetime] = None
    ) -> Dict:
        if start_date is None:
            start_date = datetime.now() + timedelta(days=1)
        
        attractions = self.get_candidate_attractions(
            destinations=intent.get("destinations", []),
            interests=intent.get("interests", []),
            companions=intent.get("companions", "couple"),
            budget=intent.get("budget", 2000),
            days=intent.get("days", 2)
        )
        
        if not attractions:
            return {"error": "未找到符合条件的景点", "schedule": []}
        
        daily_schedules = self.planner.plan_multi_day_itinerary(
            attractions=attractions,
            days=intent.get("days", 2),
            start_date=start_date,
            departure_city=intent.get("departure", "上海"),
            pace=intent.get("pace", "normal")
        )
        
        itinerary_data = {
            "intent": intent,
            "days": [],
            "summary": {
                "total_attractions": len(attractions),
                "cities": list(set(a.city for a in attractions)),
                "total_cost": 0
            }
        }
        
        total_cost = 0
        for day_idx, schedule in enumerate(daily_schedules):
            cost_info = self.planner.calculate_total_cost(schedule)
            total_cost += cost_info["total"]
            
            warnings = self.planner.validate_schedule(schedule, start_date + timedelta(days=day_idx))
            
            day_data = {
                "day": day_idx + 1,
                "date": (start_date + timedelta(days=day_idx)).strftime("%Y-%m-%d"),
                "schedule": schedule,
                "cost": cost_info,
                "warnings": warnings
            }
            itinerary_data["days"].append(day_data)
        
        itinerary_data["summary"]["total_cost"] = total_cost
        
        return itinerary_data
    
    async def enhance_itinerary_content(self, itinerary_data: Dict, user_input: str) -> Dict:
        system_prompt = """你是一位资深的江浙沪旅游规划师。请根据以下精确的时间安排，为每一天的行程添加生动的描述和实用建议。

要求：
1. 保持时间节点不变
2. 为每个景点增加游玩亮点和拍照建议
3. 添加餐饮推荐的具体菜品
4. 在每天结束时添加"今日总结"和"明日预告"
5. 语气要亲切、专业，像一位老朋友在介绍
6. 输出 JSON 格式，保持原有结构，只添加 content 和 tips 字段"""

        prompt = f"""用户原始需求：{user_input}

行程数据：
{json.dumps(itinerary_data, ensure_ascii=False, indent=2)}

请为这个行程添加内容润色，输出完整的 JSON。"""

        try:
            response = self.llm_client.chat.completions.create(
                model="glm-4-flash",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            content = response.choices[0].message.content
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            enhanced = json.loads(content)
            return enhanced
        except Exception as e:
            print(f"内容润色失败: {e}")
            return itinerary_data
    
    async def generate_itinerary_full(self, user_input: str, start_date: Optional[datetime] = None) -> Dict:
        intent = await self.parse_user_intent(user_input)
        
        itinerary_data = self.generate_optimized_itinerary(intent, start_date)
        
        if "error" not in itinerary_data:
            itinerary_data = await self.enhance_itinerary_content(itinerary_data, user_input)
        
        return itinerary_data
    
    async def modify_itinerary(
        self,
        original_itinerary: Dict,
        modification_request: str
    ) -> Dict:
        system_prompt = """你是一个行程修改助手。用户想要修改已有的行程，请理解用户的修改意图并输出修改指令。

输出格式：
{
  "action": "add/remove/replace/adjust_time",
  "target": "要操作的对象",
  "details": "具体修改内容"
}

支持的修改类型：
- add: 添加新景点或活动
- remove: 删除某个景点或活动
- replace: 替换某个景点
- adjust_time: 调整时间安排"""

        try:
            response = self.llm_client.chat.completions.create(
                model="glm-4-flash",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"原行程：{json.dumps(original_itinerary, ensure_ascii=False)}\n\n修改请求：{modification_request}"}
                ],
                temperature=0.1,
                max_tokens=300
            )
            
            content = response.choices[0].message.content
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            modification = json.loads(content.strip())
            
            return self._apply_modification(original_itinerary, modification)
        except Exception as e:
            print(f"行程修改失败: {e}")
            return original_itinerary
    
    def _apply_modification(self, itinerary: Dict, modification: Dict) -> Dict:
        action = modification.get("action")
        target = modification.get("target", "")
        details = modification.get("details", "")
        
        if action == "remove":
            for day in itinerary.get("days", []):
                day["schedule"] = [
                    event for event in day.get("schedule", [])
                    if target not in event.get("name", "") and target not in event.get("attraction_name", "")
                ]
        
        elif action == "add":
            new_attraction = self.db.query(Attraction).filter(
                Attraction.name.contains(target)
            ).first()
            
            if new_attraction and itinerary.get("days"):
                last_day = itinerary["days"][-1]
                new_event = {
                    "type": "attraction",
                    "attraction_id": new_attraction.id,
                    "name": new_attraction.name,
                    "city": new_attraction.city,
                    "duration_minutes": new_attraction.avg_visit_duration,
                    "ticket_price": new_attraction.ticket_price,
                    "latitude": new_attraction.latitude,
                    "longitude": new_attraction.longitude
                }
                last_day["schedule"].append(new_event)
        
        return itinerary


class IntentParser:
    INTENT_PATTERNS = {
        "create_itinerary": ["规划", "行程", "旅游", "游玩", "攻略"],
        "modify_itinerary": ["修改", "调整", "删除", "增加", "替换"],
        "query_info": ["介绍", "怎么样", "什么", "多少", "几点"],
        "get_recommendations": ["推荐", "建议", "适合"]
    }
    
    @classmethod
    def detect_intent(cls, user_input: str) -> str:
        user_input = user_input.lower()
        scores = {intent: 0 for intent in cls.INTENT_PATTERNS}
        
        for intent, patterns in cls.INTENT_PATTERNS.items():
            for pattern in patterns:
                if pattern in user_input:
                    scores[intent] += 1
        
        max_intent = max(scores, key=scores.get)
        return max_intent if scores[max_intent] > 0 else "create_itinerary"
    
    @classmethod
    def extract_entities(cls, user_input: str) -> Dict:
        entities = {
            "cities": [],
            "attractions": [],
            "dates": [],
            "numbers": []
        }
        
        city_keywords = ["上海", "杭州", "苏州", "南京", "无锡", "扬州", "绍兴", "嘉兴", "宁波", "常州"]
        for city in city_keywords:
            if city in user_input:
                entities["cities"].append(city)
        
        import re
        numbers = re.findall(r'\d+', user_input)
        entities["numbers"] = [int(n) for n in numbers]
        
        date_patterns = [
            r'\d{4}年\d{1,2}月\d{1,2}日',
            r'\d{1,2}月\d{1,2}日',
            r'明天', r'后天', r'下周', r'周末'
        ]
        for pattern in date_patterns:
            matches = re.findall(pattern, user_input)
            entities["dates"].extend(matches)
        
        return entities
