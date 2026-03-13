"""
行程规划算法引擎
基于时间窗的路径规划，解决 TSP/VRP 问题变种
"""
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Attraction, TransportMatrix, Restaurant
import math

class ItineraryPlanner:
    def __init__(self, db: Session):
        self.db = db
        self._transport_cache = {}
        self._attraction_cache = {}
    
    def get_attraction(self, attraction_id: int) -> Optional[Attraction]:
        if attraction_id not in self._attraction_cache:
            self._attraction_cache[attraction_id] = self.db.query(Attraction).filter(Attraction.id == attraction_id).first()
        return self._attraction_cache[attraction_id]
    
    def get_transport_time(self, from_city: str, to_city: str, transport_type: str = "高铁") -> Tuple[int, float]:
        cache_key = (from_city, to_city, transport_type)
        if cache_key not in self._transport_cache:
            transport = self.db.query(TransportMatrix).filter(
                TransportMatrix.from_city == from_city,
                TransportMatrix.to_city == to_city,
                TransportMatrix.transport_type == transport_type
            ).first()
            if transport:
                self._transport_cache[cache_key] = (transport.duration_minutes, (transport.cost_min + transport.cost_max) / 2)
            else:
                self._transport_cache[cache_key] = (60, 100)
        return self._transport_cache[cache_key]
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c
    
    def is_attraction_open(self, attraction: Attraction, visit_time: datetime) -> bool:
        open_time = datetime.strptime(attraction.open_time, "%H:%M").time()
        close_time = datetime.strptime(attraction.close_time, "%H:%M").time()
        visit_time_only = visit_time.time()
        
        if open_time <= close_time:
            return open_time <= visit_time_only <= close_time
        else:
            return visit_time_only >= open_time or visit_time_only <= close_time
    
    def is_attraction_closed_on_day(self, attraction: Attraction, visit_date: datetime) -> bool:
        if not attraction.closed_days:
            return False
        closed_days = [d.strip() for d in attraction.closed_days.split(",")]
        weekday_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        weekday = weekday_names[visit_date.weekday()]
        return weekday in closed_days
    
    def check_booking_requirement(self, attraction: Attraction, visit_date: datetime) -> Dict:
        if not attraction.booking_required:
            return {"required": False, "ok": True}
        
        days_until_visit = (visit_date.date() - datetime.now().date()).days
        advance_days = attraction.booking_advance_days or 0
        
        return {
            "required": True,
            "ok": days_until_visit >= advance_days,
            "advance_days": advance_days,
            "booking_url": attraction.booking_url,
            "message": f"该景点需提前{advance_days}天预约" if advance_days > 0 else "该景点需要预约"
        }
    
    def plan_single_day(
        self,
        attractions: List[Attraction],
        start_time: datetime,
        end_time: datetime,
        start_location: Optional[Tuple[float, float]] = None,
        pace: str = "normal",
        insert_meals: bool = True
    ) -> List[Dict]:
        if not attractions:
            return []
        
        pace_multiplier = {"relaxed": 1.3, "normal": 1.0, "tight": 0.8}.get(pace, 1.0)
        
        sorted_attractions = self._sort_attractions_by_proximity(attractions, start_location)
        
        schedule = []
        current_time = start_time
        current_location = start_location
        current_city = None
        
        meal_inserted = {"lunch": False, "dinner": False}
        
        for attraction in sorted_attractions:
            if current_time >= end_time:
                break
            
            if self.is_attraction_closed_on_day(attraction, start_time):
                continue
            
            if current_city and current_city != attraction.city:
                travel_time, travel_cost = self.get_transport_time(current_city, attraction.city)
                travel_event = {
                    "type": "inter_city_travel",
                    "from_city": current_city,
                    "to_city": attraction.city,
                    "duration_minutes": travel_time,
                    "cost": travel_cost,
                    "start_time": current_time.strftime("%H:%M"),
                    "end_time": (current_time + timedelta(minutes=travel_time)).strftime("%H:%M")
                }
                schedule.append(travel_event)
                current_time += timedelta(minutes=travel_time)
            
            if not self.is_attraction_open(attraction, current_time):
                wait_minutes = self._calculate_wait_time(attraction, current_time)
                if wait_minutes > 0 and current_time + timedelta(minutes=wait_minutes) < end_time:
                    schedule.append({
                        "type": "wait",
                        "duration_minutes": wait_minutes,
                        "reason": f"等待{attraction.name}开放",
                        "start_time": current_time.strftime("%H:%M"),
                        "end_time": (current_time + timedelta(minutes=wait_minutes)).strftime("%H:%M")
                    })
                    current_time += timedelta(minutes=wait_minutes)
            
            if insert_meals and not meal_inserted["lunch"] and current_time.hour >= 11 and current_time.hour <= 13:
                meal_event = self._insert_meal(current_time, attraction, "lunch")
                if meal_event:
                    schedule.append(meal_event)
                    current_time += timedelta(minutes=meal_event["duration_minutes"])
                    meal_inserted["lunch"] = True
            
            visit_duration = int(attraction.avg_visit_duration * pace_multiplier)
            
            visit_event = {
                "type": "attraction",
                "attraction_id": attraction.id,
                "name": attraction.name,
                "city": attraction.city,
                "category": attraction.category,
                "description": attraction.description,
                "latitude": attraction.latitude,
                "longitude": attraction.longitude,
                "address": attraction.address,
                "duration_minutes": visit_duration,
                "ticket_price": attraction.ticket_price,
                "booking_required": attraction.booking_required,
                "tips": attraction.tips,
                "warnings": attraction.warnings,
                "start_time": current_time.strftime("%H:%M"),
                "end_time": (current_time + timedelta(minutes=visit_duration)).strftime("%H:%M")
            }
            schedule.append(visit_event)
            
            current_time += timedelta(minutes=visit_duration)
            current_location = (attraction.latitude, attraction.longitude)
            current_city = attraction.city
            
            if insert_meals and not meal_inserted["dinner"] and current_time.hour >= 17 and current_time.hour <= 19:
                meal_event = self._insert_meal(current_time, attraction, "dinner")
                if meal_event:
                    schedule.append(meal_event)
                    current_time += timedelta(minutes=meal_event["duration_minutes"])
                    meal_inserted["dinner"] = True
        
        return schedule
    
    def _sort_attractions_by_proximity(
        self,
        attractions: List[Attraction],
        start_location: Optional[Tuple[float, float]] = None
    ) -> List[Attraction]:
        if len(attractions) <= 1:
            return attractions
        
        if start_location is None and attractions:
            start_location = (attractions[0].latitude, attractions[0].longitude)
        
        if start_location is None:
            return attractions
        
        sorted_list = []
        remaining = list(attractions)
        current_loc = start_location
        
        while remaining:
            nearest_idx = 0
            nearest_dist = float('inf')
            
            for i, attr in enumerate(remaining):
                dist = self.calculate_distance(current_loc[0], current_loc[1], attr.latitude, attr.longitude)
                if dist < nearest_dist:
                    nearest_dist = dist
                    nearest_idx = i
            
            nearest = remaining.pop(nearest_idx)
            sorted_list.append(nearest)
            current_loc = (nearest.latitude, nearest.longitude)
        
        return sorted_list
    
    def _calculate_wait_time(self, attraction: Attraction, current_time: datetime) -> int:
        open_time = datetime.strptime(attraction.open_time, "%H:%M").time()
        current_time_only = current_time.time()
        
        if current_time_only < open_time:
            open_datetime = datetime.combine(current_time.date(), open_time)
            current_datetime = datetime.combine(current_time.date(), current_time_only)
            return int((open_datetime - current_datetime).total_seconds() / 60)
        
        return 0
    
    def _insert_meal(self, current_time: datetime, nearby_attraction: Attraction, meal_type: str) -> Optional[Dict]:
        duration = 60 if meal_type == "lunch" else 90
        
        restaurants = self.db.query(Restaurant).filter(
            Restaurant.city == nearby_attraction.city
        ).order_by(Restaurant.rating.desc()).limit(3).all()
        
        restaurant = restaurants[0] if restaurants else None
        
        meal_event = {
            "type": "meal",
            "meal_type": meal_type,
            "duration_minutes": duration,
            "start_time": current_time.strftime("%H:%M"),
            "end_time": (current_time + timedelta(minutes=duration)).strftime("%H:%M")
        }
        
        if restaurant:
            meal_event.update({
                "restaurant_id": restaurant.id,
                "restaurant_name": restaurant.name,
                "address": restaurant.address,
                "cuisine_type": restaurant.cuisine_type,
                "avg_cost": restaurant.avg_cost_per_person,
                "specialty_dishes": restaurant.specialty_dishes,
                "latitude": restaurant.latitude,
                "longitude": restaurant.longitude
            })
        
        return meal_event
    
    def plan_multi_day_itinerary(
        self,
        attractions: List[Attraction],
        days: int,
        start_date: datetime,
        departure_city: str,
        pace: str = "normal",
        daily_start_time: str = "09:00",
        daily_end_time: str = "18:00"
    ) -> List[List[Dict]]:
        if not attractions:
            return [[] for _ in range(days)]
        
        attractions_by_city = {}
        for attr in attractions:
            if attr.city not in attractions_by_city:
                attractions_by_city[attr.city] = []
            attractions_by_city[attr.city].append(attr)
        
        cities = list(attractions_by_city.keys())
        city_order = self._optimize_city_order(cities, departure_city)
        
        attractions_per_day = max(1, len(attractions) // days)
        
        daily_schedules = []
        current_city_idx = 0
        remaining_attractions = list(attractions)
        
        for day in range(days):
            day_date = start_date + timedelta(days=day)
            start_time = datetime.combine(day_date.date(), datetime.strptime(daily_start_time, "%H:%M").time())
            end_time = datetime.combine(day_date.date(), datetime.strptime(daily_end_time, "%H:%M").time())
            
            if day == 0:
                start_location = None
            else:
                prev_day = daily_schedules[-1]
                last_event = prev_day[-1] if prev_day else None
                if last_event and "latitude" in last_event:
                    start_location = (last_event["latitude"], last_event["longitude"])
                else:
                    start_location = None
            
            day_attractions = []
            total_duration = 0
            max_duration = (end_time - start_time).total_seconds() / 60 - 120
            
            while remaining_attractions and total_duration < max_duration:
                attr = remaining_attractions[0]
                attr_duration = attr.avg_visit_duration
                
                if total_duration + attr_duration <= max_duration:
                    day_attractions.append(attr)
                    total_duration += attr_duration
                    remaining_attractions.pop(0)
                else:
                    break
            
            schedule = self.plan_single_day(
                attractions=day_attractions,
                start_time=start_time,
                end_time=end_time,
                start_location=start_location,
                pace=pace,
                insert_meals=True
            )
            
            daily_schedules.append(schedule)
        
        return daily_schedules
    
    def _optimize_city_order(self, cities: List[str], start_city: str) -> List[str]:
        if not cities:
            return []
        
        if start_city in cities:
            cities.remove(start_city)
            return [start_city] + cities
        
        return cities
    
    def calculate_total_cost(self, schedule: List[Dict], num_people: int = 1) -> Dict:
        total_ticket = 0
        total_transport = 0
        total_meal = 0
        
        for event in schedule:
            if event.get("type") == "attraction":
                total_ticket += event.get("ticket_price", 0) * num_people
            elif event.get("type") == "inter_city_travel":
                total_transport += event.get("cost", 0) * num_people
            elif event.get("type") == "meal":
                total_meal += event.get("avg_cost", 100) * num_people
        
        return {
            "ticket": total_ticket,
            "transport": total_transport,
            "meal": total_meal,
            "total": total_ticket + total_transport + total_meal
        }
    
    def validate_schedule(self, schedule: List[Dict], visit_date: datetime) -> List[Dict]:
        warnings = []
        
        for event in schedule:
            if event.get("type") == "attraction":
                attraction = self.get_attraction(event.get("attraction_id"))
                if attraction:
                    if self.is_attraction_closed_on_day(attraction, visit_date):
                        warnings.append({
                            "type": "closed",
                            "attraction": attraction.name,
                            "message": f"{attraction.name}在当天闭馆"
                        })
                    
                    booking_check = self.check_booking_requirement(attraction, visit_date)
                    if booking_check["required"] and not booking_check["ok"]:
                        warnings.append({
                            "type": "booking",
                            "attraction": attraction.name,
                            "message": booking_check["message"],
                            "booking_url": booking_check.get("booking_url")
                        })
        
        return warnings


class ItineraryOptimizer:
    def __init__(self, planner: ItineraryPlanner):
        self.planner = planner
    
    def optimize_for_time(
        self,
        attractions: List[Attraction],
        max_hours_per_day: int = 8
    ) -> List[List[Attraction]]:
        if not attractions:
            return []
        
        total_duration = sum(a.avg_visit_duration for a in attractions)
        total_minutes = total_duration + (len(attractions) - 1) * 30
        total_hours = total_minutes / 60
        
        min_days = max(1, int(total_hours / max_hours_per_day) + (1 if total_hours % max_hours_per_day else 0))
        
        days_allocation = [[] for _ in range(min_days)]
        day_durations = [0] * min_days
        
        sorted_attractions = sorted(attractions, key=lambda x: x.avg_visit_duration, reverse=True)
        
        for attr in sorted_attractions:
            min_day = 0
            min_duration = day_durations[0]
            for i, duration in enumerate(day_durations):
                if duration < min_duration:
                    min_duration = duration
                    min_day = i
            
            days_allocation[min_day].append(attr)
            day_durations[min_day] += attr.avg_visit_duration + 30
        
        return days_allocation
    
    def optimize_for_cost(
        self,
        attractions: List[Attraction],
        budget: float,
        prioritize_free: bool = True
    ) -> List[Attraction]:
        if prioritize_free:
            free_attractions = [a for a in attractions if a.ticket_price == 0]
            paid_attractions = sorted([a for a in attractions if a.ticket_price > 0], key=lambda x: x.ticket_price)
            
            selected = free_attractions.copy()
            remaining_budget = budget
            
            for attr in paid_attractions:
                if attr.ticket_price <= remaining_budget:
                    selected.append(attr)
                    remaining_budget -= attr.ticket_price
            
            return selected
        else:
            sorted_by_rating = sorted(attractions, key=lambda x: x.rating, reverse=True)
            selected = []
            remaining_budget = budget
            
            for attr in sorted_by_rating:
                if attr.ticket_price <= remaining_budget:
                    selected.append(attr)
                    remaining_budget -= attr.ticket_price
            
            return selected
    
    def optimize_for_companion(
        self,
        attractions: List[Attraction],
        companion_type: str
    ) -> List[Attraction]:
        suitability_map = {
            "亲子": ["亲子", "家庭"],
            "情侣": ["情侣"],
            "家庭": ["家庭", "亲子"],
            "朋友": ["朋友", "情侣"],
            "独行": ["独行", "朋友"]
        }
        
        suitable_tags = suitability_map.get(companion_type, [])
        
        def calculate_suitability(attr: Attraction) -> float:
            score = attr.rating
            suitable_for = attr.suitable_for or ""
            for tag in suitable_tags:
                if tag in suitable_for:
                    score += 0.5
            return score
        
        return sorted(attractions, key=calculate_suitability, reverse=True)
