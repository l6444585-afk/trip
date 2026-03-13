"""
整合版行程规划服务
结合规则引擎、量化计算、Prompt模板管理
实现"算法保证可行性，大模型保证可读性"的设计原则
"""
from typing import List, Dict, Optional, Any
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
import json
import os
from zhipuai import ZhipuAI

from enhanced_models import Attraction, City, Restaurant, Hotel, TransportMatrix
from rule_engine import RuleEngine, ScheduleValidator
from calculation_service import CalculationService, TimeCalculator, DistanceCalculator, BudgetCalculator
from prompt_templates import PromptTemplateManager, PromptBuilder, get_output_format


class ItineraryPlanningService:
    """行程规划服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.rule_engine = RuleEngine(db)
        self.calc_service = CalculationService(db)
        self.prompt_manager = PromptTemplateManager()
        self.llm_client = ZhipuAI(api_key=os.getenv("GLM_API_KEY"))
    
    def get_attractions_by_criteria(
        self,
        destinations: List[str],
        interests: List[str],
        budget: float,
        days: int,
        visit_date: date
    ) -> List[Attraction]:
        """根据条件获取景点"""
        query = self.db.query(Attraction).filter(Attraction.rating > 0)
        
        if destinations:
            query = query.filter(Attraction.city.in_(destinations))
        
        attractions = query.order_by(Attraction.rating.desc()).all()
        
        available_attractions = self.rule_engine.get_available_attractions(
            attractions, visit_date
        )
        
        if interests:
            def interest_score(attr: Attraction) -> float:
                tags = (attr.tags or "").lower()
                score = attr.rating
                for interest in interests:
                    if interest.lower() in tags:
                        score += 0.5
                return score
            available_attractions = sorted(available_attractions, key=interest_score, reverse=True)
        
        max_attractions = min(days * 4, len(available_attractions))
        selected_attractions = available_attractions[:max_attractions]
        
        budget_per_attraction = budget / days * 0.3 if days > 0 else budget * 0.3
        selected_attractions = [
            a for a in selected_attractions
            if (a.ticket_price or 0) <= budget_per_attraction or a.ticket_price == 0
        ]
        
        return selected_attractions
    
    def get_restaurants_by_city(self, city: str, limit: int = 5) -> List[Restaurant]:
        """获取城市餐厅"""
        return self.db.query(Restaurant).filter(
            Restaurant.city == city
        ).order_by(Restaurant.rating.desc()).limit(limit).all()
    
    def get_transport_info(self, from_city: str, to_city: str) -> Optional[Dict]:
        """获取交通信息"""
        transport = self.db.query(TransportMatrix).filter(
            TransportMatrix.from_city == from_city,
            TransportMatrix.to_city == to_city
        ).first()
        
        if transport:
            return {
                "type": transport.transport_type,
                "duration_minutes": transport.duration_minutes,
                "cost_min": transport.cost_min,
                "cost_max": transport.cost_max,
                "frequency": transport.frequency
            }
        return None
    
    def build_attractions_data(self, attractions: List[Attraction]) -> List[Dict]:
        """构建景点数据"""
        return [
            {
                "id": a.id,
                "name": a.name,
                "city": a.city,
                "category": a.category,
                "latitude": a.latitude,
                "longitude": a.longitude,
                "address": a.address,
                "rating": a.rating,
                "avg_visit_duration": a.avg_visit_duration,
                "open_time": a.open_time,
                "close_time": a.close_time,
                "closed_days": a.closed_days,
                "ticket_price": a.ticket_price,
                "ticket_price_peak": a.ticket_price_peak,
                "booking_required": a.booking_required,
                "booking_advance_days": a.booking_advance_days,
                "booking_url": a.booking_url,
                "tags": a.tags,
                "suitable_for": a.suitable_for,
                "best_time_to_visit": a.best_time_to_visit,
                "peak_hours": a.peak_hours,
                "indoor_outdoor": a.indoor_outdoor,
                "weather_sensitive": a.weather_sensitive,
                "tips": a.tips,
                "warnings": a.warnings
            }
            for a in attractions
        ]
    
    def build_transport_data(self, cities: List[str]) -> List[Dict]:
        """构建交通数据"""
        transports = []
        for i in range(len(cities) - 1):
            info = self.get_transport_info(cities[i], cities[i + 1])
            if info:
                transports.append({
                    "from": cities[i],
                    "to": cities[i + 1],
                    **info
                })
        return transports
    
    def build_business_rules_data(self, attractions: List[Attraction]) -> List[Dict]:
        """构建业务规则数据"""
        rules = self.rule_engine.load_rules()
        
        applicable_rules = []
        attraction_ids = [a.id for a in attractions]
        cities = list(set(a.city for a in attractions))
        
        for rule in rules:
            if rule.attraction_id in attraction_ids:
                applicable_rules.append({
                    "rule_type": rule.rule_type.value,
                    "rule_name": rule.rule_name,
                    "condition": f"{rule.condition.condition_type.value}: {rule.condition.condition_value}",
                    "action": f"{rule.action.action_type.value}: {rule.action.action_value}"
                })
            elif rule.city in cities:
                applicable_rules.append({
                    "rule_type": rule.rule_type.value,
                    "rule_name": rule.rule_name,
                    "condition": f"{rule.condition.condition_type.value}: {rule.condition.condition_value}",
                    "action": f"{rule.action.action_type.value}: {rule.action.action_value}"
                })
        
        return applicable_rules
    
    def calculate_schedule_metrics(self, schedule: Dict) -> Dict:
        """计算日程指标"""
        daily_plans = schedule.get("daily_plans", [])
        
        total_attractions = 0
        total_cost = 0
        total_duration = 0
        
        for day in daily_plans:
            for period in ["morning", "afternoon", "evening"]:
                activities = day.get(period, {}).get("activities", [])
                for activity in activities:
                    if activity.get("type") == "景点":
                        total_attractions += 1
                        total_cost += activity.get("cost", 0)
                        total_duration += activity.get("duration_minutes", 0)
            
            for meal in ["lunch", "dinner"]:
                meal_data = day.get(meal, {}).get("recommendation", {})
                total_cost += meal_data.get("average_cost", 0)
        
        return {
            "total_attractions": total_attractions,
            "total_cost": total_cost,
            "total_duration_hours": round(total_duration / 60, 1)
        }
    
    def validate_and_fix_schedule(
        self,
        schedule: Dict,
        start_date: date
    ) -> Dict:
        """验证并修复日程"""
        validator = ScheduleValidator(self.rule_engine)
        validation_result = validator.validate_schedule(
            schedule.get("daily_plans", []),
            start_date
        )
        
        if not validation_result["is_valid"]:
            for error in validation_result["errors"]:
                print(f"日程验证错误: {error}")
        
        schedule["validation"] = {
            "is_valid": validation_result["is_valid"],
            "warnings": validation_result["warnings"],
            "errors": validation_result["errors"]
        }
        
        return schedule
    
    async def generate_itinerary(
        self,
        departure: str,
        destinations: List[str],
        days: int,
        budget: float,
        companion_type: str,
        interests: List[str],
        start_date: date,
        pace: str = "normal",
        travel_mode: str = "公共交通",
        age_group: str = "成年人"
    ) -> Dict:
        """生成行程"""
        attractions = self.get_attractions_by_criteria(
            destinations, interests, budget, days, start_date
        )
        
        if not attractions:
            return {
                "success": False,
                "error": "未找到符合条件的景点",
                "itinerary": None
            }
        
        attractions_data = self.build_attractions_data(attractions)
        cities = list(set(a.city for a in attractions))
        transport_data = self.build_transport_data([departure] + cities)
        rules_data = self.build_business_rules_data(attractions)
        
        user_request = {
            "出发城市": departure,
            "目的地城市": destinations,
            "出行天数": days,
            "预算上限": f"{budget}元",
            "出行类型": companion_type,
            "兴趣偏好": interests,
            "出行方式": travel_mode,
            "年龄段": age_group,
            "节奏偏好": pace,
            "开始日期": start_date.isoformat()
        }
        
        prompt_builder = PromptBuilder()
        prompt_builder.add_system_prompt()
        
        itinerary_prompt = self.prompt_manager.render_template(
            "itinerary_generation",
            user_request_json=json.dumps(user_request, ensure_ascii=False, indent=2),
            attractions_data=json.dumps(attractions_data, ensure_ascii=False, indent=2),
            transport_data=json.dumps(transport_data, ensure_ascii=False, indent=2),
            business_rules=json.dumps(rules_data, ensure_ascii=False, indent=2),
            days=days,
            pace=pace,
            budget=budget,
            travel_mode=travel_mode,
            age_group=age_group,
            companion_type=companion_type,
            output_format=get_output_format("single")
        )
        
        messages = [
            {"role": "system", "content": self.prompt_manager.render_template("system_base")},
            {"role": "user", "content": itinerary_prompt}
        ]
        
        try:
            response = self.llm_client.chat.completions.create(
                model="glm-4-flash",
                messages=messages,
                temperature=0.7,
                max_tokens=4000
            )
            
            content = response.choices[0].message.content
            itinerary_data = self._parse_llm_response(content)
            
            if itinerary_data:
                itinerary_data = self.validate_and_fix_schedule(itinerary_data, start_date)
                
                metrics = self.calculate_schedule_metrics(itinerary_data)
                itinerary_data["metrics"] = metrics
            
            return {
                "success": True,
                "itinerary": itinerary_data,
                "attractions_count": len(attractions),
                "cities": cities
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "itinerary": None
            }
    
    async def generate_multiple_itineraries(
        self,
        departure: str,
        destinations: List[str],
        days: int,
        budget: float,
        companion_type: str,
        interests: List[str],
        start_date: date
    ) -> Dict:
        """生成多个行程方案"""
        attractions = self.get_attractions_by_criteria(
            destinations, interests, budget, days, start_date
        )
        
        if not attractions:
            return {
                "success": False,
                "error": "未找到符合条件的景点",
                "plans": None
            }
        
        attractions_data = self.build_attractions_data(attractions)
        
        user_request = {
            "出发城市": departure,
            "目的地城市": destinations,
            "出行天数": days,
            "预算上限": f"{budget}元",
            "出行类型": companion_type,
            "兴趣偏好": interests,
            "开始日期": start_date.isoformat()
        }
        
        multi_prompt = self.prompt_manager.render_template(
            "multi_plan_generation",
            user_request_json=json.dumps(user_request, ensure_ascii=False, indent=2),
            attractions_data=json.dumps(attractions_data, ensure_ascii=False, indent=2),
            output_format=get_output_format("multi")
        )
        
        messages = [
            {"role": "system", "content": self.prompt_manager.render_template("system_base")},
            {"role": "user", "content": multi_prompt}
        ]
        
        try:
            response = self.llm_client.chat.completions.create(
                model="glm-4-flash",
                messages=messages,
                temperature=0.8,
                max_tokens=6000
            )
            
            content = response.choices[0].message.content
            plans_data = self._parse_llm_response(content)
            
            return {
                "success": True,
                "plans": plans_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "plans": None
            }
    
    async def enhance_content(
        self,
        itinerary_data: Dict,
        user_input: str
    ) -> Dict:
        """内容润色"""
        enhancement_prompt = self.prompt_manager.render_template(
            "content_enhancement",
            user_input=user_input,
            itinerary_data=json.dumps(itinerary_data, ensure_ascii=False, indent=2)
        )
        
        messages = [
            {"role": "system", "content": "你是一位资深的江浙沪旅游规划师。"},
            {"role": "user", "content": enhancement_prompt}
        ]
        
        try:
            response = self.llm_client.chat.completions.create(
                model="glm-4-flash",
                messages=messages,
                temperature=0.7,
                max_tokens=4000
            )
            
            content = response.choices[0].message.content
            enhanced_data = self._parse_llm_response(content)
            
            return enhanced_data or itinerary_data
            
        except Exception as e:
            print(f"内容润色失败: {e}")
            return itinerary_data
    
    def _parse_llm_response(self, content: str) -> Optional[Dict]:
        """解析LLM响应"""
        import re
        
        try:
            content = content.strip()
            
            if content.startswith("```json"):
                content = content[7:]
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
                    print(f"JSON解析错误: {e}")
                    return None
                    
        except Exception as e:
            print(f"解析响应失败: {e}")
            return None
    
    def get_booking_reminders(
        self,
        attractions: List[Attraction],
        visit_dates: List[date]
    ) -> List[Dict]:
        """获取预约提醒"""
        return self.rule_engine.check_booking_requirements(attractions, visit_dates)
    
    def get_price_info(
        self,
        attraction: Attraction,
        visit_date: date
    ) -> Dict:
        """获取价格信息"""
        return self.rule_engine.get_price_adjustments(attraction, visit_date)
    
    def check_feasibility(
        self,
        attractions: List[Attraction],
        days: int,
        budget: float,
        age_group: str,
        companion_type: str
    ) -> Dict:
        """检查可行性"""
        metrics = self.calc_service.calculate_itinerary_metrics(
            attractions, days, budget
        )
        
        physical_check = self.calc_service.feasibility.check_physical_feasibility(
            attractions, age_group, companion_type
        )
        
        return {
            "budget_feasibility": metrics["budget_check"],
            "physical_feasibility": physical_check,
            "metrics": metrics
        }
