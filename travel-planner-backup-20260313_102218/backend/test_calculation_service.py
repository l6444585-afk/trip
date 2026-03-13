"""
计算服务单元测试
"""
import pytest
from datetime import datetime, timedelta
from calculation_service import CalculationService

class TestCalculationService:
    
    @pytest.fixture
    def calc_service(self):
        return CalculationService()
    
    def test_calculate_distance(self, calc_service):
        lat1, lon1 = 31.2304, 121.4737
        lat2, lon2 = 30.2741, 120.1551
        
        distance = calc_service.calculate_distance(lat1, lon1, lat2, lon2)
        
        assert distance > 0
        assert 150 < distance < 200
    
    def test_calculate_travel_time_by_distance(self, calc_service):
        distance = 100
        
        driving_time = calc_service.calculate_travel_time(distance, "driving")
        assert 60 < driving_time < 180
        
        walking_time = calc_service.calculate_travel_time(distance, "walking")
        assert walking_time > driving_time
    
    def test_calculate_budget_breakdown(self, calc_service):
        total_budget = 3000
        days = 3
        attractions = [
            {"ticket_price": 80},
            {"ticket_price": 100},
            {"ticket_price": 50}
        ]
        
        breakdown = calc_service.calculate_budget_breakdown(
            total_budget=total_budget,
            days=days,
            attractions=attractions,
            transport_mode="高铁"
        )
        
        assert "transport" in breakdown
        assert "accommodation" in breakdown
        assert "food" in breakdown
        assert "tickets" in breakdown
        assert "other" in breakdown
        assert breakdown["total"] <= total_budget
    
    def test_estimate_daily_cost(self, calc_service):
        city = "上海"
        
        cost = calc_service.estimate_daily_cost(city)
        assert cost > 0
        assert 500 < cost < 1500
    
    def test_calculate_total_trip_cost(self, calc_service):
        schedule = [
            {
                "type": "attraction",
                "ticket_price": 80
            },
            {
                "type": "meal",
                "avg_cost": 100
            },
            {
                "type": "inter_city_travel",
                "cost": 150
            }
        ]
        
        total_cost = calc_service.calculate_total_trip_cost(schedule, num_people=2)
        
        assert total_cost > 0
        assert total_cost == (80 + 100 + 150) * 2
    
    def test_calculate_time_between_attractions(self, calc_service):
        attraction1 = {
            "latitude": 31.3170,
            "longitude": 120.6330,
            "city": "苏州"
        }
        attraction2 = {
            "latitude": 31.3150,
            "longitude": 120.6300,
            "city": "苏州"
        }
        
        time = calc_service.calculate_time_between_attractions(
            attraction1, attraction2, "walking"
        )
        
        assert time > 0
        assert time < 30
    
    def test_estimate_visit_duration(self, calc_service):
        attraction = {
            "name": "拙政园",
            "category": "古典园林",
            "avg_visit_duration": 180
        }
        
        duration = calc_service.estimate_visit_duration(attraction, pace="normal")
        assert duration == 180
        
        relaxed_duration = calc_service.estimate_visit_duration(attraction, pace="relaxed")
        assert relaxed_duration > duration
        
        tight_duration = calc_service.estimate_visit_duration(attraction, pace="tight")
        assert tight_duration < duration
    
    def test_check_time_feasibility(self, calc_service):
        start_time = datetime.strptime("09:00", "%H:%M")
        end_time = datetime.strptime("18:00", "%H:%M")
        
        activities = [
            {"duration": 120},
            {"duration": 60},
            {"duration": 180}
        ]
        
        result = calc_service.check_time_feasibility(
            start_time, end_time, activities
        )
        
        assert "feasible" in result
        assert "total_time" in result
        assert "available_time" in result
    
    def test_optimize_schedule_order(self, calc_service):
        start_location = (31.2304, 121.4737)
        
        attractions = [
            {"name": "A", "latitude": 31.24, "longitude": 121.49},
            {"name": "B", "latitude": 31.22, "longitude": 121.48},
            {"name": "C", "latitude": 31.25, "longitude": 121.50}
        ]
        
        optimized = calc_service.optimize_schedule_order(attractions, start_location)
        
        assert len(optimized) == len(attractions)
        assert optimized[0]["name"] in ["A", "B", "C"]
    
    def test_calculate_fatigue_score(self, calc_service):
        schedule = [
            {"duration": 120, "type": "attraction"},
            {"duration": 60, "type": "meal"},
            {"duration": 180, "type": "attraction"},
            {"duration": 120, "type": "attraction"}
        ]
        
        score = calc_service.calculate_fatigue_score(schedule)
        
        assert 0 <= score <= 10
    
    def test_suggest_rest_points(self, calc_service):
        schedule = [
            {"start_time": "09:00", "end_time": "12:00", "type": "attraction"},
            {"start_time": "12:00", "end_time": "13:00", "type": "meal"},
            {"start_time": "13:00", "end_time": "17:00", "type": "attraction"}
        ]
        
        rest_suggestions = calc_service.suggest_rest_points(schedule)
        
        assert isinstance(rest_suggestions, list)


class TestTimeCalculations:
    
    @pytest.fixture
    def calc_service(self):
        return CalculationService()
    
    def test_add_time_buffer(self, calc_service):
        base_time = datetime.strptime("10:00", "%H:%M")
        
        result = calc_service.add_time_buffer(base_time, minutes=30)
        expected = datetime.strptime("10:30", "%H:%M")
        
        assert result == expected
    
    def test_calculate_available_time_slots(self, calc_service):
        start_time = datetime.strptime("09:00", "%H:%M")
        end_time = datetime.strptime("18:00", "%H:%M")
        
        existing_events = [
            {"start": "12:00", "end": "13:00"},
            {"start": "15:00", "end": "16:00"}
        ]
        
        slots = calc_service.calculate_available_time_slots(
            start_time, end_time, existing_events
        )
        
        assert len(slots) == 3
        assert all(slot["duration"] > 0 for slot in slots)
    
    def test_find_best_time_slot(self, calc_service):
        slots = [
            {"start": "09:00", "end": "11:00", "duration": 120},
            {"start": "14:00", "end": "17:00", "duration": 180},
            {"start": "18:00", "end": "20:00", "duration": 120}
        ]
        
        required_duration = 150
        
        best = calc_service.find_best_time_slot(slots, required_duration)
        
        assert best is not None
        assert best["duration"] >= required_duration


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
