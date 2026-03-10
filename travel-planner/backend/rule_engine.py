"""
规则引擎模块
处理行程规划中的硬性约束条件
支持动态添加、修改和管理各类业务规则
"""
from typing import List, Dict, Optional, Any, Callable
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from enum import Enum
import re
import json

from enhanced_models import BusinessRule, Holiday, Attraction


class RuleType(Enum):
    """规则类型"""
    CLOSED_DAY = "闭馆日"
    BOOKING_REQUIRED = "预约要求"
    TIME_ADJUSTMENT = "时间调整"
    PRICE_ADJUSTMENT = "价格调整"
    VISITOR_LIMIT = "客流限制"
    WEATHER_DEPENDENT = "天气依赖"
    SEASONAL = "季节性规则"
    CUSTOM = "自定义规则"


class ConditionType(Enum):
    """条件类型"""
    WEEKDAY = "weekday"
    DATE_RANGE = "date_range"
    HOLIDAY = "holiday"
    TIME_RANGE = "time_range"
    WEATHER = "weather"
    CUSTOM = "custom"


class ActionType(Enum):
    """动作类型"""
    EXCLUDE = "exclude"
    REQUIRE_BOOKING = "require_booking"
    ADJUST_TIME = "adjust_time"
    ADJUST_PRICE = "adjust_price"
    PARTIAL_CLOSE = "partial_close"
    WARN = "warn"
    LIMIT_VISITORS = "limit_visitors"


class RuleCondition:
    """规则条件"""
    
    def __init__(self, condition_type: str, condition_value: str):
        self.condition_type = ConditionType(condition_type)
        self.condition_value = condition_value
    
    def evaluate(self, context: Dict) -> bool:
        """评估条件是否满足"""
        if self.condition_type == ConditionType.WEEKDAY:
            return self._evaluate_weekday(context)
        elif self.condition_type == ConditionType.DATE_RANGE:
            return self._evaluate_date_range(context)
        elif self.condition_type == ConditionType.HOLIDAY:
            return self._evaluate_holiday(context)
        elif self.condition_type == ConditionType.TIME_RANGE:
            return self._evaluate_time_range(context)
        elif self.condition_type == ConditionType.WEATHER:
            return self._evaluate_weather(context)
        else:
            return True
    
    def _evaluate_weekday(self, context: Dict) -> bool:
        """评估星期条件"""
        visit_date = context.get("visit_date")
        if not visit_date:
            return False
        
        weekday_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        weekday = weekday_names[visit_date.weekday()]
        
        closed_days = [d.strip() for d in self.condition_value.split(",")]
        return weekday in closed_days
    
    def _evaluate_date_range(self, context: Dict) -> bool:
        """评估日期范围条件"""
        visit_date = context.get("visit_date")
        if not visit_date:
            return False
        
        try:
            parts = self.condition_value.split(",")
            if len(parts) == 2:
                start_str, end_str = parts
                year = visit_date.year
                
                start_date = datetime.strptime(f"{year}-{start_str}", "%Y-%m-%d").date()
                end_date = datetime.strptime(f"{year}-{end_str}", "%Y-%m-%d").date()
                
                return start_date <= visit_date <= end_date
        except:
            pass
        
        return False
    
    def _evaluate_holiday(self, context: Dict) -> bool:
        """评估节假日条件"""
        if self.condition_value == "all":
            return context.get("is_holiday", False)
        
        holiday_name = context.get("holiday_name")
        return holiday_name == self.condition_value
    
    def _evaluate_time_range(self, context: Dict) -> bool:
        """评估时间范围条件"""
        visit_time = context.get("visit_time")
        if not visit_time:
            return False
        
        try:
            parts = self.condition_value.split("-")
            if len(parts) == 2:
                start_time = parts[0].strip()
                end_time = parts[1].strip()
                
                visit_minutes = self._time_to_minutes(visit_time)
                start_minutes = self._time_to_minutes(start_time)
                end_minutes = self._time_to_minutes(end_time)
                
                return start_minutes <= visit_minutes <= end_minutes
        except:
            pass
        
        return False
    
    def _evaluate_weather(self, context: Dict) -> bool:
        """评估天气条件"""
        weather = context.get("weather", "")
        return weather.lower() in self.condition_value.lower()
    
    def _time_to_minutes(self, time_str: str) -> int:
        """将时间字符串转换为分钟数"""
        parts = time_str.split(":")
        return int(parts[0]) * 60 + int(parts[1])


class RuleAction:
    """规则动作"""
    
    def __init__(self, action_type: str, action_value: str):
        self.action_type = ActionType(action_type)
        self.action_value = action_value
    
    def execute(self, target: Any) -> Dict:
        """执行动作"""
        result = {
            "action": self.action_type.value,
            "value": self.action_value,
            "executed": True
        }
        
        if self.action_type == ActionType.EXCLUDE:
            result["excluded"] = True
            result["reason"] = f"被规则排除：{self.action_value}"
        
        elif self.action_type == ActionType.REQUIRE_BOOKING:
            result["booking_required"] = True
            result["advance_days"] = int(self.action_value) if self.action_value.isdigit() else 0
        
        elif self.action_type == ActionType.ADJUST_TIME:
            if "-" in self.action_value:
                parts = self.action_value.split("-")
                result["adjusted_open_time"] = parts[0]
                result["adjusted_close_time"] = parts[1]
        
        elif self.action_type == ActionType.ADJUST_PRICE:
            result["adjusted_price"] = float(self.action_value)
        
        elif self.action_type == ActionType.PARTIAL_CLOSE:
            result["partial_close"] = self.action_value
        
        elif self.action_type == ActionType.WARN:
            result["warning"] = self.action_value
        
        elif self.action_type == ActionType.LIMIT_VISITORS:
            result["visitor_limit"] = int(self.action_value)
        
        return result


class Rule:
    """规则"""
    
    def __init__(
        self,
        rule_id: int,
        rule_type: str,
        rule_name: str,
        condition_type: str,
        condition_value: str,
        action_type: str,
        action_value: str,
        priority: int = 0,
        is_active: bool = True,
        city: str = None,
        attraction_id: int = None
    ):
        self.rule_id = rule_id
        self.rule_type = RuleType(rule_type)
        self.rule_name = rule_name
        self.condition = RuleCondition(condition_type, condition_value)
        self.action = RuleAction(action_type, action_value)
        self.priority = priority
        self.is_active = is_active
        self.city = city
        self.attraction_id = attraction_id
    
    def evaluate(self, context: Dict) -> Optional[Dict]:
        """评估规则"""
        if not self.is_active:
            return None
        
        if self.condition.evaluate(context):
            return self.action.execute(None)
        
        return None
    
    def applies_to(self, attraction: Attraction) -> bool:
        """判断规则是否适用于指定景点"""
        if self.attraction_id and self.attraction_id == attraction.id:
            return True
        
        if self.city and self.city == attraction.city:
            return True
        
        if not self.attraction_id and not self.city:
            return True
        
        return False


class RuleEngine:
    """规则引擎"""
    
    def __init__(self, db: Session):
        self.db = db
        self._rules_cache = None
        self._holidays_cache = None
    
    def load_rules(self, force_reload: bool = False) -> List[Rule]:
        """加载规则"""
        if self._rules_cache is None or force_reload:
            rules_data = self.db.query(BusinessRule).filter(
                BusinessRule.is_active == True
            ).order_by(BusinessRule.priority.desc()).all()
            
            self._rules_cache = [
                Rule(
                    rule_id=r.id,
                    rule_type=r.rule_type,
                    rule_name=r.rule_name,
                    condition_type=r.condition_type,
                    condition_value=r.condition_value,
                    action_type=r.action_type,
                    action_value=r.action_value,
                    priority=r.priority,
                    is_active=r.is_active,
                    city=r.city,
                    attraction_id=r.attraction_id
                )
                for r in rules_data
            ]
        
        return self._rules_cache
    
    def load_holidays(self, force_reload: bool = False) -> Dict[date, Dict]:
        """加载节假日"""
        if self._holidays_cache is None or force_reload:
            holidays_data = self.db.query(Holiday).all()
            
            self._holidays_cache = {}
            for h in holidays_data:
                self._holidays_cache[h.date] = {
                    "name": h.name,
                    "is_public_holiday": h.is_public_holiday,
                    "affected_cities": h.affected_cities,
                    "special_notes": h.special_notes
                }
        
        return self._holidays_cache
    
    def get_holiday_info(self, check_date: date) -> Optional[Dict]:
        """获取节假日信息"""
        holidays = self.load_holidays()
        return holidays.get(check_date)
    
    def build_context(
        self,
        visit_date: date,
        visit_time: str = None,
        attraction: Attraction = None,
        weather: str = None
    ) -> Dict:
        """构建规则评估上下文"""
        context = {
            "visit_date": visit_date,
            "visit_time": visit_time,
            "weather": weather,
            "is_holiday": False,
            "holiday_name": None
        }
        
        holiday_info = self.get_holiday_info(visit_date)
        if holiday_info:
            context["is_holiday"] = True
            context["holiday_name"] = holiday_info["name"]
            context["holiday_info"] = holiday_info
        
        return context
    
    def evaluate_attraction(
        self,
        attraction: Attraction,
        visit_date: date,
        visit_time: str = None
    ) -> Dict:
        """评估景点规则"""
        rules = self.load_rules()
        context = self.build_context(visit_date, visit_time, attraction)
        
        result = {
            "attraction_id": attraction.id,
            "attraction_name": attraction.name,
            "is_available": True,
            "excluded": False,
            "warnings": [],
            "adjustments": {},
            "applied_rules": []
        }
        
        for rule in rules:
            if not rule.applies_to(attraction):
                continue
            
            rule_result = rule.evaluate(context)
            if rule_result:
                result["applied_rules"].append({
                    "rule_id": rule.rule_id,
                    "rule_name": rule.rule_name,
                    "result": rule_result
                })
                
                if rule_result.get("excluded"):
                    result["excluded"] = True
                    result["is_available"] = False
                    result["exclude_reason"] = rule_result.get("reason")
                
                if rule_result.get("booking_required"):
                    result["adjustments"]["booking_required"] = True
                    result["adjustments"]["booking_advance_days"] = rule_result.get("advance_days", 0)
                
                if rule_result.get("adjusted_price"):
                    result["adjustments"]["adjusted_price"] = rule_result["adjusted_price"]
                
                if rule_result.get("adjusted_open_time"):
                    result["adjustments"]["adjusted_open_time"] = rule_result["adjusted_open_time"]
                    result["adjustments"]["adjusted_close_time"] = rule_result["adjusted_close_time"]
                
                if rule_result.get("warning"):
                    result["warnings"].append(rule_result["warning"])
                
                if rule_result.get("partial_close"):
                    result["warnings"].append(f"部分区域闭馆：{rule_result['partial_close']}")
        
        return result
    
    def filter_attractions(
        self,
        attractions: List[Attraction],
        visit_date: date,
        exclude_closed: bool = True
    ) -> List[Dict]:
        """过滤景点列表"""
        results = []
        
        for attraction in attractions:
            eval_result = self.evaluate_attraction(attraction, visit_date)
            
            if exclude_closed and eval_result["excluded"]:
                continue
            
            results.append({
                "attraction": attraction,
                "evaluation": eval_result
            })
        
        return results
    
    def get_available_attractions(
        self,
        attractions: List[Attraction],
        visit_date: date
    ) -> List[Attraction]:
        """获取可用景点列表"""
        filtered = self.filter_attractions(attractions, visit_date, exclude_closed=True)
        return [item["attraction"] for item in filtered]
    
    def check_booking_requirements(
        self,
        attractions: List[Attraction],
        visit_dates: List[date]
    ) -> List[Dict]:
        """检查预约要求"""
        results = []
        
        for attraction in attractions:
            for visit_date in visit_dates:
                eval_result = self.evaluate_attraction(attraction, visit_date)
                
                if attraction.booking_required or eval_result["adjustments"].get("booking_required"):
                    advance_days = eval_result["adjustments"].get(
                        "booking_advance_days",
                        attraction.booking_advance_days or 0
                    )
                    
                    days_until_visit = (visit_date - date.today()).days
                    
                    results.append({
                        "attraction_id": attraction.id,
                        "attraction_name": attraction.name,
                        "visit_date": visit_date.isoformat(),
                        "booking_required": True,
                        "advance_days": advance_days,
                        "is_urgent": days_until_visit <= advance_days,
                        "booking_url": attraction.booking_url,
                        "status": "ok" if days_until_visit > advance_days else "urgent"
                    })
        
        return results
    
    def get_price_adjustments(
        self,
        attraction: Attraction,
        visit_date: date
    ) -> Dict:
        """获取价格调整"""
        eval_result = self.evaluate_attraction(attraction, visit_date)
        
        base_price = attraction.ticket_price or 0
        adjusted_price = eval_result["adjustments"].get("adjusted_price", base_price)
        
        return {
            "base_price": base_price,
            "adjusted_price": adjusted_price,
            "has_adjustment": adjusted_price != base_price,
            "reason": "节假日票价调整" if adjusted_price != base_price else None
        }
    
    def add_rule(
        self,
        rule_type: str,
        rule_name: str,
        condition_type: str,
        condition_value: str,
        action_type: str,
        action_value: str,
        priority: int = 0,
        city: str = None,
        attraction_id: int = None,
        description: str = None
    ) -> BusinessRule:
        """添加规则"""
        rule = BusinessRule(
            rule_type=rule_type,
            rule_name=rule_name,
            description=description or rule_name,
            condition_type=condition_type,
            condition_value=condition_value,
            action_type=action_type,
            action_value=action_value,
            priority=priority,
            is_active=True,
            city=city,
            attraction_id=attraction_id
        )
        
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        
        self._rules_cache = None
        
        return rule
    
    def update_rule(self, rule_id: int, updates: Dict) -> Optional[BusinessRule]:
        """更新规则"""
        rule = self.db.query(BusinessRule).filter(BusinessRule.id == rule_id).first()
        
        if rule:
            for key, value in updates.items():
                if hasattr(rule, key):
                    setattr(rule, key, value)
            
            self.db.commit()
            self.db.refresh(rule)
            self._rules_cache = None
        
        return rule
    
    def delete_rule(self, rule_id: int) -> bool:
        """删除规则"""
        rule = self.db.query(BusinessRule).filter(BusinessRule.id == rule_id).first()
        
        if rule:
            self.db.delete(rule)
            self.db.commit()
            self._rules_cache = None
            return True
        
        return False
    
    def toggle_rule(self, rule_id: int, is_active: bool) -> Optional[BusinessRule]:
        """启用/禁用规则"""
        return self.update_rule(rule_id, {"is_active": is_active})


class RuleValidator:
    """规则验证器"""
    
    @staticmethod
    def validate_rule_data(rule_data: Dict) -> Dict:
        """验证规则数据"""
        errors = []
        
        required_fields = ["rule_type", "rule_name", "condition_type", "condition_value", "action_type", "action_value"]
        for field in required_fields:
            if field not in rule_data or not rule_data[field]:
                errors.append(f"缺少必填字段：{field}")
        
        valid_rule_types = [rt.value for rt in RuleType]
        if rule_data.get("rule_type") not in valid_rule_types:
            errors.append(f"无效的规则类型：{rule_data.get('rule_type')}")
        
        valid_condition_types = [ct.value for ct in ConditionType]
        if rule_data.get("condition_type") not in valid_condition_types:
            errors.append(f"无效的条件类型：{rule_data.get('condition_type')}")
        
        valid_action_types = [at.value for at in ActionType]
        if rule_data.get("action_type") not in valid_action_types:
            errors.append(f"无效的动作类型：{rule_data.get('action_type')}")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors
        }
    
    @staticmethod
    def validate_condition_value(condition_type: str, condition_value: str) -> bool:
        """验证条件值格式"""
        if condition_type == ConditionType.WEEKDAY.value:
            valid_weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
            days = [d.strip() for d in condition_value.split(",")]
            return all(d in valid_weekdays for d in days)
        
        elif condition_type == ConditionType.DATE_RANGE.value:
            try:
                parts = condition_value.split(",")
                if len(parts) == 2:
                    datetime.strptime(parts[0], "%m-%d")
                    datetime.strptime(parts[1], "%m-%d")
                    return True
            except:
                pass
            return False
        
        elif condition_type == ConditionType.TIME_RANGE.value:
            try:
                parts = condition_value.split("-")
                if len(parts) == 2:
                    datetime.strptime(parts[0].strip(), "%H:%M")
                    datetime.strptime(parts[1].strip(), "%H:%M")
                    return True
            except:
                pass
            return False
        
        return True


class ScheduleValidator:
    """日程验证器"""
    
    def __init__(self, rule_engine: RuleEngine):
        self.rule_engine = rule_engine
    
    def validate_schedule(
        self,
        schedule: List[Dict],
        start_date: date
    ) -> Dict:
        """验证日程"""
        results = {
            "is_valid": True,
            "warnings": [],
            "errors": [],
            "day_validations": []
        }
        
        for day_idx, day_schedule in enumerate(schedule):
            visit_date = start_date + timedelta(days=day_idx)
            day_result = self._validate_day(day_schedule, visit_date)
            results["day_validations"].append(day_result)
            
            if not day_result["is_valid"]:
                results["is_valid"] = False
            
            results["warnings"].extend(day_result.get("warnings", []))
            results["errors"].extend(day_result.get("errors", []))
        
        return results
    
    def _validate_day(self, day_schedule: Dict, visit_date: date) -> Dict:
        """验证单日日程"""
        result = {
            "date": visit_date.isoformat(),
            "is_valid": True,
            "warnings": [],
            "errors": [],
            "attraction_validations": []
        }
        
        activities = day_schedule.get("activities", [])
        
        for activity in activities:
            if activity.get("type") == "attraction":
                attraction_id = activity.get("attraction_id")
                if attraction_id:
                    attraction = self.rule_engine.db.query(Attraction).filter(
                        Attraction.id == attraction_id
                    ).first()
                    
                    if attraction:
                        visit_time = activity.get("start_time", "09:00")
                        eval_result = self.rule_engine.evaluate_attraction(
                            attraction, visit_date, visit_time
                        )
                        
                        result["attraction_validations"].append(eval_result)
                        
                        if eval_result["excluded"]:
                            result["errors"].append(
                                f"{attraction.name}在{visit_date}不可用：{eval_result.get('exclude_reason')}"
                            )
                            result["is_valid"] = False
                        
                        result["warnings"].extend(eval_result.get("warnings", []))
        
        return result
