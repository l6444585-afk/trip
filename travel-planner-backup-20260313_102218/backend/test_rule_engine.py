"""
规则引擎单元测试
"""
import pytest
from datetime import datetime, timedelta
from rule_engine import RuleEngine, RuleType, RuleCondition, RuleAction

class TestRuleEngine:
    
    @pytest.fixture
    def rule_engine(self):
        return RuleEngine()
    
    def test_evaluate_time_condition_before(self, rule_engine):
        condition = RuleCondition(
            field="current_time",
            operator="before",
            value="18:00"
        )
        
        early_time = datetime.strptime("14:00", "%H:%M")
        result = rule_engine.evaluate_condition(condition, {"current_time": early_time})
        assert result is True
        
        late_time = datetime.strptime("20:00", "%H:%M")
        result = rule_engine.evaluate_condition(condition, {"current_time": late_time})
        assert result is False
    
    def test_evaluate_time_condition_after(self, rule_engine):
        condition = RuleCondition(
            field="current_time",
            operator="after",
            value="09:00"
        )
        
        late_time = datetime.strptime("14:00", "%H:%M")
        result = rule_engine.evaluate_condition(condition, {"current_time": late_time})
        assert result is True
        
        early_time = datetime.strptime("08:00", "%H:%M")
        result = rule_engine.evaluate_condition(condition, {"current_time": early_time})
        assert result is False
    
    def test_evaluate_equals_condition(self, rule_engine):
        condition = RuleCondition(
            field="city",
            operator="equals",
            value="苏州"
        )
        
        assert rule_engine.evaluate_condition(condition, {"city": "苏州"}) is True
        assert rule_engine.evaluate_condition(condition, {"city": "杭州"}) is False
    
    def test_evaluate_contains_condition(self, rule_engine):
        condition = RuleCondition(
            field="tags",
            operator="contains",
            value="亲子"
        )
        
        assert rule_engine.evaluate_condition(condition, {"tags": ["亲子", "家庭"]}) is True
        assert rule_engine.evaluate_condition(condition, {"tags": ["情侣", "朋友"]}) is False
    
    def test_evaluate_greater_than_condition(self, rule_engine):
        condition = RuleCondition(
            field="budget",
            operator="greater_than",
            value=1000
        )
        
        assert rule_engine.evaluate_condition(condition, {"budget": 2000}) is True
        assert rule_engine.evaluate_condition(condition, {"budget": 500}) is False
    
    def test_evaluate_less_than_condition(self, rule_engine):
        condition = RuleCondition(
            field="days",
            operator="less_than",
            value=5
        )
        
        assert rule_engine.evaluate_condition(condition, {"days": 3}) is True
        assert rule_engine.evaluate_condition(condition, {"days": 7}) is False
    
    def test_check_attraction_closed_monday(self, rule_engine):
        monday = datetime(2024, 1, 1)
        
        attraction = {
            "name": "苏州博物馆",
            "closed_days": ["周一"]
        }
        
        result = rule_engine.check_attraction_available(attraction, monday)
        assert result["available"] is False
        assert "周一闭馆" in result["reason"]
    
    def test_check_attraction_open(self, rule_engine):
        tuesday = datetime(2024, 1, 2)
        
        attraction = {
            "name": "拙政园",
            "closed_days": []
        }
        
        result = rule_engine.check_attraction_available(attraction, tuesday)
        assert result["available"] is True
    
    def test_check_booking_requirement(self, rule_engine):
        attraction_with_booking = {
            "name": "苏州博物馆",
            "booking_required": True,
            "booking_advance_days": 7
        }
        
        visit_date = datetime.now() + timedelta(days=3)
        result = rule_engine.check_booking_requirement(attraction_with_booking, visit_date)
        assert result["ok"] is False
        assert "提前" in result["message"]
        
        visit_date_late = datetime.now() + timedelta(days=10)
        result = rule_engine.check_booking_requirement(attraction_with_booking, visit_date_late)
        assert result["ok"] is True
    
    def test_check_time_window(self, rule_engine):
        attraction = {
            "name": "拙政园",
            "open_time": "07:30",
            "close_time": "17:30"
        }
        
        morning_time = datetime.strptime("09:00", "%H:%M")
        result = rule_engine.check_time_window(attraction, morning_time)
        assert result["within_window"] is True
        
        evening_time = datetime.strptime("18:00", "%H:%M")
        result = rule_engine.check_time_window(attraction, evening_time)
        assert result["within_window"] is False
    
    def test_apply_rule_skip_attraction(self, rule_engine):
        rule = {
            "type": RuleType.SKIP_ATTRACTION,
            "conditions": [
                RuleCondition(field="companion_type", operator="equals", value="亲子")
            ],
            "action": RuleAction(
                type="skip",
                target="酒吧"
            )
        }
        
        context = {"companion_type": "亲子"}
        attraction = {"name": "某酒吧", "category": "酒吧"}
        
        result = rule_engine.apply_rule(rule, attraction, context)
        assert result["skip"] is True
        
        context2 = {"companion_type": "情侣"}
        result = rule_engine.apply_rule(rule, attraction, context2)
        assert result["skip"] is False
    
    def test_validate_schedule(self, rule_engine):
        schedule = [
            {
                "attraction": {
                    "name": "苏州博物馆",
                    "closed_days": ["周一"],
                    "open_time": "09:00",
                    "close_time": "17:00"
                },
                "visit_time": datetime(2024, 1, 1, 10, 0)
            }
        ]
        
        warnings = rule_engine.validate_schedule(schedule)
        assert len(warnings) > 0
        assert any("闭馆" in w["message"] for w in warnings)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
