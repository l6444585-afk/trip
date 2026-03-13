"""
量化计算服务模块
处理时间计算、距离测算、预算管理等量化逻辑
确保数值计算的精确性和可靠性
"""
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from models import Attraction, TransportMatrix, Restaurant, City
import math


class TimeCalculator:
    """时间计算器"""
    
    @staticmethod
    def parse_time(time_str: str) -> datetime:
        """解析时间字符串"""
        try:
            return datetime.strptime(time_str, "%H:%M")
        except ValueError:
            return datetime.strptime("08:00", "%H:%M")
    
    @staticmethod
    def format_time(dt: datetime) -> str:
        """格式化时间"""
        return dt.strftime("%H:%M")
    
    @staticmethod
    def time_diff_minutes(start: str, end: str) -> int:
        """计算时间差（分钟）"""
        start_dt = TimeCalculator.parse_time(start)
        end_dt = TimeCalculator.parse_time(end)
        
        if end_dt < start_dt:
            end_dt += timedelta(days=1)
        
        return int((end_dt - start_dt).total_seconds() / 60)
    
    @staticmethod
    def add_minutes(time_str: str, minutes: int) -> str:
        """在时间上增加分钟数"""
        dt = TimeCalculator.parse_time(time_str)
        result = dt + timedelta(minutes=minutes)
        return TimeCalculator.format_time(result)
    
    @staticmethod
    def is_within_range(time_str: str, start: str, end: str) -> bool:
        """判断时间是否在范围内"""
        t = TimeCalculator.parse_time(time_str).time()
        s = TimeCalculator.parse_time(start).time()
        e = TimeCalculator.parse_time(end).time()
        
        if s <= e:
            return s <= t <= e
        else:
            return t >= s or t <= e
    
    @staticmethod
    def get_weekday_name(d: date) -> str:
        """获取星期几的中文名称"""
        weekday_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        return weekday_names[d.weekday()]
    
    @staticmethod
    def is_weekend(d: date) -> bool:
        """判断是否为周末"""
        return d.weekday() >= 5
    
    @staticmethod
    def calculate_available_hours(open_time: str, close_time: str) -> float:
        """计算可用时长（小时）"""
        minutes = TimeCalculator.time_diff_minutes(open_time, close_time)
        return minutes / 60


class DistanceCalculator:
    """距离计算器"""
    
    EARTH_RADIUS_KM = 6371
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """使用Haversine公式计算两点间的球面距离（公里）"""
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return DistanceCalculator.EARTH_RADIUS_KM * c
    
    @staticmethod
    def estimate_travel_time(distance_km: float, mode: str = "driving") -> int:
        """估算旅行时间（分钟）"""
        speed_map = {
            "walking": 5,
            "cycling": 15,
            "driving": 40,
            "transit": 30,
            "high_speed_rail": 250
        }
        
        speed = speed_map.get(mode, 40)
        hours = distance_km / speed
        return int(hours * 60)
    
    @staticmethod
    def calculate_route_distance(points: List[Tuple[float, float]]) -> float:
        """计算路径总距离"""
        if len(points) < 2:
            return 0
        
        total = 0
        for i in range(len(points) - 1):
            total += DistanceCalculator.haversine_distance(
                points[i][0], points[i][1],
                points[i + 1][0], points[i + 1][1]
            )
        return total
    
    @staticmethod
    def find_nearest_point(
        origin: Tuple[float, float],
        points: List[Tuple[float, float]]
    ) -> Tuple[int, float]:
        """找到最近的点"""
        if not points:
            return -1, 0
        
        min_dist = float('inf')
        min_idx = 0
        
        for i, point in enumerate(points):
            dist = DistanceCalculator.haversine_distance(
                origin[0], origin[1], point[0], point[1]
            )
            if dist < min_dist:
                min_dist = dist
                min_idx = i
        
        return min_idx, min_dist


class BudgetCalculator:
    """预算计算器"""
    
    @staticmethod
    def calculate_ticket_cost(attractions: List[Dict], num_people: int = 1) -> float:
        """计算门票总费用"""
        total = 0
        for attr in attractions:
            price = attr.get("ticket_price", 0)
            total += price * num_people
        return total
    
    @staticmethod
    def calculate_meal_cost(meals: List[Dict], num_people: int = 1) -> float:
        """计算餐饮总费用"""
        total = 0
        for meal in meals:
            avg_cost = meal.get("avg_cost", 80)
            total += avg_cost * num_people
        return total
    
    @staticmethod
    def calculate_transport_cost(transports: List[Dict], num_people: int = 1) -> float:
        """计算交通总费用"""
        total = 0
        for transport in transports:
            cost_min = transport.get("cost_min", 0)
            cost_max = transport.get("cost_max", 0)
            avg_cost = (cost_min + cost_max) / 2
            total += avg_cost * num_people
        return total
    
    @staticmethod
    def calculate_accommodation_cost(hotels: List[Dict], nights: int = 1) -> float:
        """计算住宿总费用"""
        total = 0
        for hotel in hotels:
            price_min = hotel.get("price_min", 200)
            price_max = hotel.get("price_max", 400)
            avg_price = (price_min + price_max) / 2
            total += avg_price * nights
        return total
    
    @staticmethod
    def calculate_total_budget(
        attractions: List[Dict],
        meals: List[Dict],
        transports: List[Dict],
        hotels: List[Dict],
        days: int,
        num_people: int = 1
    ) -> Dict:
        """计算总预算"""
        tickets = BudgetCalculator.calculate_ticket_cost(attractions, num_people)
        dining = BudgetCalculator.calculate_meal_cost(meals, num_people)
        transport = BudgetCalculator.calculate_transport_cost(transports, num_people)
        accommodation = BudgetCalculator.calculate_accommodation_cost(hotels, days - 1 if days > 1 else 0)
        
        return {
            "tickets": round(tickets, 2),
            "dining": round(dining, 2),
            "transport": round(transport, 2),
            "accommodation": round(accommodation, 2),
            "total": round(tickets + dining + transport + accommodation, 2)
        }
    
    @staticmethod
    def check_budget_feasibility(budget: float, estimated_cost: float, buffer: float = 0.1) -> Dict:
        """检查预算可行性"""
        buffer_cost = estimated_cost * buffer
        total_needed = estimated_cost + buffer_cost
        
        return {
            "budget": budget,
            "estimated_cost": estimated_cost,
            "buffer": buffer_cost,
            "total_needed": total_needed,
            "is_feasible": budget >= total_needed,
            "surplus": budget - total_needed if budget >= total_needed else 0,
            "deficit": total_needed - budget if budget < total_needed else 0
        }


class ScheduleOptimizer:
    """日程优化器"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def optimize_attraction_order(
        self,
        attractions: List[Attraction],
        start_location: Optional[Tuple[float, float]] = None
    ) -> List[Attraction]:
        """使用最近邻算法优化景点顺序"""
        if len(attractions) <= 1:
            return attractions
        
        if start_location is None and attractions:
            start_location = (attractions[0].latitude, attractions[0].longitude)
        
        if start_location is None:
            return attractions
        
        sorted_attractions = []
        remaining = list(attractions)
        current_loc = start_location
        
        while remaining:
            nearest_idx = 0
            nearest_dist = float('inf')
            
            for i, attr in enumerate(remaining):
                dist = DistanceCalculator.haversine_distance(
                    current_loc[0], current_loc[1],
                    attr.latitude, attr.longitude
                )
                if dist < nearest_dist:
                    nearest_dist = dist
                    nearest_idx = i
            
            nearest = remaining.pop(nearest_idx)
            sorted_attractions.append(nearest)
            current_loc = (nearest.latitude, nearest.longitude)
        
        return sorted_attractions
    
    def calculate_total_duration(
        self,
        attractions: List[Attraction],
        include_travel: bool = True,
        include_meals: bool = True
    ) -> int:
        """计算总时长（分钟）"""
        total = 0
        
        for attr in attractions:
            total += attr.avg_visit_duration or 120
        
        if include_travel and len(attractions) > 1:
            travel_time = 30 * (len(attractions) - 1)
            total += travel_time
        
        if include_meals:
            meal_time = 60 + 90
            total += meal_time
        
        return total
    
    def estimate_daily_capacity(
        self,
        start_time: str = "09:00",
        end_time: str = "18:00",
        pace: str = "normal"
    ) -> int:
        """估算每日可游玩时长（分钟）"""
        total_minutes = TimeCalculator.time_diff_minutes(start_time, end_time)
        
        pace_multiplier = {
            "relaxed": 0.7,
            "normal": 1.0,
            "tight": 1.3
        }
        
        multiplier = pace_multiplier.get(pace, 1.0)
        return int(total_minutes * multiplier)
    
    def distribute_attractions_by_day(
        self,
        attractions: List[Attraction],
        days: int,
        daily_capacity: int
    ) -> List[List[Attraction]]:
        """将景点分配到各天"""
        if not attractions:
            return [[] for _ in range(days)]
        
        daily_attractions = []
        current_day = []
        current_duration = 0
        
        for attr in attractions:
            attr_duration = attr.avg_visit_duration or 120
            
            if current_duration + attr_duration > daily_capacity:
                if current_day:
                    daily_attractions.append(current_day)
                current_day = [attr]
                current_duration = attr_duration
            else:
                current_day.append(attr)
                current_duration += attr_duration
        
        if current_day:
            daily_attractions.append(current_day)
        
        while len(daily_attractions) < days:
            daily_attractions.append([])
        
        return daily_attractions[:days]


class FeasibilityChecker:
    """可行性检查器"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def check_attraction_open(
        self,
        attraction: Attraction,
        visit_date: date,
        visit_time: str
    ) -> Dict:
        """检查景点是否开放"""
        weekday_name = TimeCalculator.get_weekday_name(visit_date)
        
        closed_days = attraction.closed_days or ""
        if weekday_name in closed_days:
            return {
                "is_open": False,
                "reason": f"该景点{weekday_name}闭馆"
            }
        
        open_time = attraction.open_time or "08:00"
        close_time = attraction.close_time or "18:00"
        
        if TimeCalculator.is_weekend(visit_date):
            if attraction.open_time_weekend:
                open_time = attraction.open_time_weekend
            if attraction.close_time_weekend:
                close_time = attraction.close_time_weekend
        
        if not TimeCalculator.is_within_range(visit_time, open_time, close_time):
            return {
                "is_open": False,
                "reason": f"不在开放时间内（{open_time}-{close_time}）"
            }
        
        return {
            "is_open": True,
            "open_time": open_time,
            "close_time": close_time
        }
    
    def check_booking_requirement(
        self,
        attraction: Attraction,
        visit_date: date
    ) -> Dict:
        """检查预约要求"""
        if not attraction.booking_required:
            return {
                "required": False,
                "ok": True
            }
        
        days_until_visit = (visit_date - date.today()).days
        advance_days = attraction.booking_advance_days or 0
        
        return {
            "required": True,
            "ok": days_until_visit >= advance_days,
            "advance_days": advance_days,
            "booking_url": attraction.booking_url,
            "message": f"该景点需提前{advance_days}天预约" if advance_days > 0 else "该景点需要预约"
        }
    
    def check_time_feasibility(
        self,
        schedule: List[Dict],
        start_time: str,
        end_time: str
    ) -> Dict:
        """检查时间可行性"""
        total_duration = 0
        for event in schedule:
            total_duration += event.get("duration_minutes", 0)
        
        available_minutes = TimeCalculator.time_diff_minutes(start_time, end_time)
        
        return {
            "is_feasible": total_duration <= available_minutes,
            "total_duration": total_duration,
            "available_time": available_minutes,
            "surplus": available_minutes - total_duration if total_duration <= available_minutes else 0,
            "deficit": total_duration - available_minutes if total_duration > available_minutes else 0
        }
    
    def check_budget_feasibility(
        self,
        estimated_cost: float,
        budget: float
    ) -> Dict:
        """检查预算可行性"""
        return BudgetCalculator.check_budget_feasibility(budget, estimated_cost)
    
    def check_physical_feasibility(
        self,
        attractions: List[Attraction],
        age_group: str,
        companion_type: str
    ) -> Dict:
        """检查体力可行性"""
        total_duration = sum(a.avg_visit_duration or 120 for a in attractions)
        total_hours = total_duration / 60
        
        max_hours_map = {
            "elderly": 4,
            "family_with_kids": 5,
            "adult": 8,
            "youth": 10
        }
        
        max_hours = max_hours_map.get(age_group, 8)
        
        warnings = []
        if total_hours > max_hours:
            warnings.append(f"行程时长{total_hours:.1f}小时，建议不超过{max_hours}小时")
        
        indoor_count = sum(1 for a in attractions if a.indoor_outdoor == "indoor")
        outdoor_count = len(attractions) - indoor_count
        
        if outdoor_count > indoor_count * 2:
            warnings.append("户外景点较多，注意防晒和体力分配")
        
        return {
            "is_feasible": total_hours <= max_hours,
            "total_hours": total_hours,
            "max_recommended_hours": max_hours,
            "warnings": warnings
        }


class CalculationService:
    """量化计算服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.time_calc = TimeCalculator()
        self.distance_calc = DistanceCalculator()
        self.budget_calc = BudgetCalculator()
        self.scheduler = ScheduleOptimizer(db)
        self.feasibility = FeasibilityChecker(db)
    
    def calculate_itinerary_metrics(
        self,
        attractions: List[Attraction],
        days: int,
        budget: float,
        num_people: int = 1
    ) -> Dict:
        """计算行程指标"""
        total_duration = self.scheduler.calculate_total_duration(attractions)
        avg_daily_duration = total_duration / days if days > 0 else 0
        
        total_distance = 0
        if len(attractions) > 1:
            points = [(a.latitude, a.longitude) for a in attractions]
            total_distance = DistanceCalculator.calculate_route_distance(points)
        
        attraction_dicts = [
            {"ticket_price": a.ticket_price or 0} for a in attractions
        ]
        meal_dicts = [
            {"avg_cost": 80} for _ in range(days * 2)
        ]
        transport_dicts = []
        hotel_dicts = [{"price_min": 200, "price_max": 400} for _ in range(days - 1)]
        
        budget_breakdown = BudgetCalculator.calculate_total_budget(
            attraction_dicts, meal_dicts, transport_dicts, hotel_dicts, days, num_people
        )
        
        budget_check = BudgetCalculator.check_budget_feasibility(budget, budget_breakdown["total"])
        
        return {
            "total_attractions": len(attractions),
            "total_duration_minutes": total_duration,
            "avg_daily_duration_minutes": round(avg_daily_duration, 1),
            "total_distance_km": round(total_distance, 2),
            "budget_breakdown": budget_breakdown,
            "budget_check": budget_check
        }
    
    def get_transport_between_cities(
        self,
        from_city: str,
        to_city: str,
        transport_type: str = "高铁"
    ) -> Optional[Dict]:
        """获取城市间交通信息"""
        transport = self.db.query(TransportMatrix).filter(
            TransportMatrix.from_city == from_city,
            TransportMatrix.to_city == to_city,
            TransportMatrix.transport_type == transport_type
        ).first()
        
        if transport:
            return {
                "from_city": transport.from_city,
                "to_city": transport.to_city,
                "transport_type": transport.transport_type,
                "duration_minutes": transport.duration_minutes,
                "cost_min": transport.cost_min,
                "cost_max": transport.cost_max,
                "frequency": transport.frequency,
                "notes": transport.notes
            }
        
        return None
    
    def estimate_inter_city_travel(
        self,
        cities: List[str],
        transport_type: str = "高铁"
    ) -> List[Dict]:
        """估算城市间旅行"""
        travels = []
        
        for i in range(len(cities) - 1):
            transport = self.get_transport_between_cities(
                cities[i], cities[i + 1], transport_type
            )
            if transport:
                travels.append(transport)
            else:
                lat1, lon1 = 0, 0
                lat2, lon2 = 0, 0
                
                city1 = self.db.query(City).filter(City.name == cities[i]).first()
                city2 = self.db.query(City).filter(City.name == cities[i + 1]).first()
                
                if city1 and city2:
                    distance = DistanceCalculator.haversine_distance(
                        city1.latitude, city1.longitude,
                        city2.latitude, city2.longitude
                    )
                    duration = DistanceCalculator.estimate_travel_time(distance, "high_speed_rail")
                    travels.append({
                        "from_city": cities[i],
                        "to_city": cities[i + 1],
                        "transport_type": transport_type,
                        "duration_minutes": duration,
                        "distance_km": round(distance, 1),
                        "estimated": True
                    })
        
        return travels
