"""
交通接驳细化服务
提供详细的交通枢纽数据、景点接驳信息
支持"高铁站→景点"的完整接驳方案
"""
from typing import List, Dict, Optional, Tuple
from datetime import datetime, date
from sqlalchemy.orm import Session
from dataclasses import dataclass
import math

from enhanced_models import TransportMatrix, TransportHub, HubToAttraction, Attraction, City


@dataclass
class TransportSegment:
    transport_type: str
    from_location: str
    to_location: str
    duration_minutes: int
    cost_min: float
    cost_max: float
    distance_km: Optional[float]
    route_description: str
    tips: str
    
    def to_dict(self) -> Dict:
        return {
            "transport_type": self.transport_type,
            "from_location": self.from_location,
            "to_location": self.to_location,
            "duration_minutes": self.duration_minutes,
            "cost_min": self.cost_min,
            "cost_max": self.cost_max,
            "distance_km": round(self.distance_km, 1) if self.distance_km else None,
            "route_description": self.route_description,
            "tips": self.tips
        }


@dataclass
class ConnectionPlan:
    origin_city: str
    destination_city: str
    origin_hub: Optional[Dict]
    destination_hub: Optional[Dict]
    inter_city_segment: TransportSegment
    last_mile_segment: Optional[TransportSegment]
    total_duration_minutes: int
    total_cost_min: float
    total_cost_max: float
    summary: str
    
    def to_dict(self) -> Dict:
        return {
            "origin_city": self.origin_city,
            "destination_city": self.destination_city,
            "origin_hub": self.origin_hub,
            "destination_hub": self.destination_hub,
            "inter_city_segment": self.inter_city_segment.to_dict() if self.inter_city_segment else None,
            "last_mile_segment": self.last_mile_segment.to_dict() if self.last_mile_segment else None,
            "total_duration_minutes": self.total_duration_minutes,
            "total_cost_min": round(self.total_cost_min, 0),
            "total_cost_max": round(self.total_cost_max, 0),
            "summary": self.summary
        }


class TransportConnectionService:
    """交通接驳服务"""
    
    EARTH_RADIUS_KM = 6371
    
    HUB_TYPE_NAMES = {
        "high_speed_rail": "高铁站",
        "railway_station": "火车站",
        "airport": "机场",
        "bus_station": "汽车站",
        "metro_station": "地铁站"
    }
    
    TRANSPORT_MODE_NAMES = {
        "high_speed_rail": "高铁",
        "train": "火车",
        "airplane": "飞机",
        "bus": "大巴",
        "metro": "地铁",
        "taxi": "打车",
        "didacheap": "网约车",
        "walking": "步行",
        "public_transit": "公共交通"
    }
    
    JIANGNAN_HUBS = {
        "上海": [
            {"name": "上海虹桥站", "type": "high_speed_rail", "code": "AOH", "is_main": True},
            {"name": "上海站", "type": "railway_station", "code": "SHH", "is_main": True},
            {"name": "上海南站", "type": "railway_station", "code": "SNH", "is_main": False},
            {"name": "上海浦东国际机场", "type": "airport", "code": "PVG", "is_main": True},
            {"name": "上海虹桥国际机场", "type": "airport", "code": "SHA", "is_main": True},
        ],
        "杭州": [
            {"name": "杭州东站", "type": "high_speed_rail", "code": "HGH", "is_main": True},
            {"name": "杭州站", "type": "railway_station", "code": "HZH", "is_main": False},
            {"name": "杭州萧山国际机场", "type": "airport", "code": "HGH", "is_main": True},
        ],
        "苏州": [
            {"name": "苏州站", "type": "high_speed_rail", "code": "SZH", "is_main": True},
            {"name": "苏州北站", "type": "high_speed_rail", "code": "OHH", "is_main": True},
            {"name": "苏州园区站", "type": "high_speed_rail", "code": "KAH", "is_main": False},
        ],
        "南京": [
            {"name": "南京南站", "type": "high_speed_rail", "code": "NKH", "is_main": True},
            {"name": "南京站", "type": "railway_station", "code": "NJH", "is_main": False},
            {"name": "南京禄口国际机场", "type": "airport", "code": "NKG", "is_main": True},
        ],
        "无锡": [
            {"name": "无锡站", "type": "high_speed_rail", "code": "WXH", "is_main": True},
            {"name": "无锡东站", "type": "high_speed_rail", "code": "WGH", "is_main": True},
            {"name": "无锡硕放机场", "type": "airport", "code": "WUX", "is_main": True},
        ],
    }
    
    INTER_CITY_ROUTES = {
        ("上海", "苏州"): {
            "transport_type": "high_speed_rail",
            "duration_minutes": 25,
            "cost_min": 35,
            "cost_max": 40,
            "frequency": "每10分钟一班",
            "from_hub": "上海虹桥站",
            "to_hub": "苏州站",
            "tips": "推荐从虹桥站出发，班次最多"
        },
        ("上海", "杭州"): {
            "transport_type": "high_speed_rail",
            "duration_minutes": 45,
            "cost_min": 73,
            "cost_max": 117,
            "frequency": "每5分钟一班",
            "from_hub": "上海虹桥站",
            "to_hub": "杭州东站",
            "tips": "杭州东站距离市区更近"
        },
        ("上海", "南京"): {
            "transport_type": "high_speed_rail",
            "duration_minutes": 60,
            "cost_min": 134,
            "cost_max": 220,
            "frequency": "每10分钟一班",
            "from_hub": "上海虹桥站",
            "to_hub": "南京南站",
            "tips": "南京南站有地铁直达市区"
        },
        ("上海", "无锡"): {
            "transport_type": "high_speed_rail",
            "duration_minutes": 35,
            "cost_min": 50,
            "cost_max": 60,
            "frequency": "每15分钟一班",
            "from_hub": "上海虹桥站",
            "to_hub": "无锡站",
            "tips": "无锡站位于市中心"
        },
        ("杭州", "苏州"): {
            "transport_type": "high_speed_rail",
            "duration_minutes": 90,
            "cost_min": 110,
            "cost_max": 150,
            "frequency": "每30分钟一班",
            "from_hub": "杭州东站",
            "to_hub": "苏州站",
            "tips": "部分班次需要在上海中转"
        },
        ("杭州", "南京"): {
            "transport_type": "high_speed_rail",
            "duration_minutes": 90,
            "cost_min": 117,
            "cost_max": 180,
            "frequency": "每15分钟一班",
            "from_hub": "杭州东站",
            "to_hub": "南京南站",
            "tips": "沿途可欣赏江南风光"
        },
        ("苏州", "无锡"): {
            "transport_type": "high_speed_rail",
            "duration_minutes": 15,
            "cost_min": 15,
            "cost_max": 20,
            "frequency": "每20分钟一班",
            "from_hub": "苏州站",
            "to_hub": "无锡站",
            "tips": "距离很近，也可选择大巴"
        },
        ("南京", "苏州"): {
            "transport_type": "high_speed_rail",
            "duration_minutes": 75,
            "cost_min": 90,
            "cost_max": 140,
            "frequency": "每20分钟一班",
            "from_hub": "南京南站",
            "to_hub": "苏州站",
            "tips": "苏州站位于古城区"
        },
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    def _haversine_distance(
        self,
        lat1: float, lon1: float,
        lat2: float, lon2: float
    ) -> float:
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return self.EARTH_RADIUS_KM * c
    
    def get_city_hubs(self, city: str) -> List[Dict]:
        hubs = self.db.query(TransportHub).filter(
            TransportHub.city == city
        ).all()
        
        if hubs:
            return [
                {
                    "id": h.id,
                    "name": h.name,
                    "type": h.hub_type,
                    "type_name": self.HUB_TYPE_NAMES.get(h.hub_type, h.hub_type),
                    "code": h.code,
                    "latitude": h.latitude,
                    "longitude": h.longitude,
                    "address": h.address,
                    "is_main_hub": h.is_main_hub,
                    "to_city_center_minutes": h.to_city_center_minutes,
                    "to_city_center_cost": {
                        "min": h.to_city_center_cost_min,
                        "max": h.to_city_center_cost_max
                    },
                    "tips": h.tips
                }
                for h in hubs
            ]
        
        default_hubs = self.JIANGNAN_HUBS.get(city, [])
        return [
            {
                "name": h["name"],
                "type": h["type"],
                "type_name": self.HUB_TYPE_NAMES.get(h["type"], h["type"]),
                "code": h["code"],
                "is_main_hub": h["is_main"],
                "is_default": True
            }
            for h in default_hubs
        ]
    
    def get_main_hub(self, city: str) -> Optional[Dict]:
        hubs = self.get_city_hubs(city)
        for hub in hubs:
            if hub.get("is_main_hub"):
                return hub
        return hubs[0] if hubs else None
    
    def get_inter_city_transport(
        self,
        from_city: str,
        to_city: str
    ) -> Optional[Dict]:
        route = self.INTER_CITY_ROUTES.get((from_city, to_city))
        if route:
            return route
        
        route = self.INTER_CITY_ROUTES.get((to_city, from_city))
        if route:
            return {
                **route,
                "from_hub": route["to_hub"],
                "to_hub": route["from_hub"]
            }
        
        transport = self.db.query(TransportMatrix).filter(
            TransportMatrix.from_city == from_city,
            TransportMatrix.to_city == to_city
        ).first()
        
        if transport:
            return {
                "transport_type": transport.transport_type,
                "duration_minutes": transport.duration_minutes,
                "cost_min": transport.cost_min,
                "cost_max": transport.cost_max,
                "frequency": transport.frequency,
                "tips": transport.notes
            }
        
        return None
    
    def estimate_last_mile(
        self,
        hub: Dict,
        attraction: Attraction
    ) -> TransportSegment:
        hub_lat = hub.get("latitude")
        hub_lon = hub.get("longitude")
        
        if hub_lat and hub_lon and attraction.latitude and attraction.longitude:
            distance = self._haversine_distance(
                hub_lat, hub_lon,
                attraction.latitude, attraction.longitude
            )
        else:
            distance = 5.0
        
        if distance <= 1.0:
            mode = "walking"
            duration = int(distance * 15)
            cost_min = 0
            cost_max = 0
            route_desc = f"步行约{int(distance * 1000)}米"
        elif distance <= 3.0:
            mode = "taxi"
            duration = int(distance * 3 + 5)
            cost_min = distance * 2.5 + 10
            cost_max = distance * 3 + 15
            route_desc = f"打车约{int(distance)}公里"
        elif distance <= 10.0:
            mode = "taxi"
            duration = int(distance * 3 + 5)
            cost_min = distance * 2.5 + 10
            cost_max = distance * 3.5 + 20
            route_desc = f"打车约{int(distance)}公里"
        else:
            mode = "public_transit"
            duration = int(distance * 4 + 15)
            cost_min = 5
            cost_max = 15
            route_desc = f"公共交通约{int(distance)}公里"
        
        return TransportSegment(
            transport_type=self.TRANSPORT_MODE_NAMES.get(mode, mode),
            from_location=hub.get("name", "交通枢纽"),
            to_location=attraction.name,
            duration_minutes=duration,
            cost_min=cost_min,
            cost_max=cost_max,
            distance_km=distance,
            route_description=route_desc,
            tips=f"从{hub.get('name', '交通枢纽')}出发"
        )
    
    def get_hub_to_attraction(
        self,
        hub_id: int,
        attraction_id: int
    ) -> Optional[Dict]:
        connection = self.db.query(HubToAttraction).filter(
            HubToAttraction.hub_id == hub_id,
            HubToAttraction.attraction_id == attraction_id
        ).first()
        
        if connection:
            return {
                "transport_mode": connection.transport_mode,
                "duration_minutes": connection.duration_minutes,
                "distance_km": connection.distance_km,
                "cost_min": connection.cost_min,
                "cost_max": connection.cost_max,
                "route_description": connection.route_description,
                "tips": connection.tips,
                "is_recommended": connection.is_recommended
            }
        
        return None
    
    def plan_connection(
        self,
        from_city: str,
        to_city: str,
        destination_attraction: Optional[Attraction] = None
    ) -> ConnectionPlan:
        origin_hub = self.get_main_hub(from_city)
        destination_hub = self.get_main_hub(to_city)
        
        inter_city = self.get_inter_city_transport(from_city, to_city)
        
        if inter_city:
            inter_city_segment = TransportSegment(
                transport_type=self.TRANSPORT_MODE_NAMES.get(
                    inter_city["transport_type"], inter_city["transport_type"]
                ),
                from_location=inter_city.get("from_hub", f"{from_city}站"),
                to_location=inter_city.get("to_hub", f"{to_city}站"),
                duration_minutes=inter_city["duration_minutes"],
                cost_min=inter_city["cost_min"],
                cost_max=inter_city["cost_max"],
                distance_km=None,
                route_description=f"{from_city} → {to_city}",
                tips=inter_city.get("tips", "")
            )
        else:
            inter_city_segment = TransportSegment(
                transport_type="高铁",
                from_location=f"{from_city}站",
                to_location=f"{to_city}站",
                duration_minutes=60,
                cost_min=100,
                cost_max=150,
                distance_km=None,
                route_description=f"{from_city} → {to_city}",
                tips="建议查询具体班次"
            )
        
        last_mile_segment = None
        if destination_attraction and destination_hub:
            last_mile_segment = self.estimate_last_mile(
                destination_hub, destination_attraction
            )
        
        total_duration = inter_city_segment.duration_minutes
        total_cost_min = inter_city_segment.cost_min
        total_cost_max = inter_city_segment.cost_max
        
        if last_mile_segment:
            total_duration += last_mile_segment.duration_minutes
            total_cost_min += last_mile_segment.cost_min
            total_cost_max += last_mile_segment.cost_max
        
        summary = f"{from_city} → {to_city}"
        if destination_attraction:
            summary += f" → {destination_attraction.name}"
        summary += f"（约{total_duration}分钟，{int(total_cost_min)}-{int(total_cost_max)}元）"
        
        return ConnectionPlan(
            origin_city=from_city,
            destination_city=to_city,
            origin_hub=origin_hub,
            destination_hub=destination_hub,
            inter_city_segment=inter_city_segment,
            last_mile_segment=last_mile_segment,
            total_duration_minutes=total_duration,
            total_cost_min=total_cost_min,
            total_cost_max=total_cost_max,
            summary=summary
        )
    
    def plan_multi_city_route(
        self,
        cities: List[str],
        attractions: List[Attraction] = None
    ) -> List[ConnectionPlan]:
        plans = []
        
        for i in range(len(cities) - 1):
            from_city = cities[i]
            to_city = cities[i + 1]
            
            destination_attraction = None
            if attractions and i < len(attractions):
                destination_attraction = attractions[i]
            
            plan = self.plan_connection(from_city, to_city, destination_attraction)
            plans.append(plan)
        
        return plans
    
    def get_transport_summary(
        self,
        cities: List[str]
    ) -> Dict:
        plans = self.plan_multi_city_route(cities)
        
        total_duration = sum(p.total_duration_minutes for p in plans)
        total_cost_min = sum(p.total_cost_min for p in plans)
        total_cost_max = sum(p.total_cost_max for p in plans)
        
        return {
            "cities": cities,
            "segments": [p.to_dict() for p in plans],
            "total_duration_minutes": total_duration,
            "total_cost_min": round(total_cost_min, 0),
            "total_cost_max": round(total_cost_max, 0),
            "summary": f"途经{len(cities)}个城市，总耗时约{total_duration}分钟，交通费用{int(total_cost_min)}-{int(total_cost_max)}元"
        }
    
    def get_all_inter_city_routes(self) -> List[Dict]:
        routes = []
        
        for (from_city, to_city), route in self.INTER_CITY_ROUTES.items():
            routes.append({
                "from_city": from_city,
                "to_city": to_city,
                "transport_type": route["transport_type"],
                "duration_minutes": route["duration_minutes"],
                "cost_min": route["cost_min"],
                "cost_max": route["cost_max"],
                "frequency": route["frequency"],
                "from_hub": route["from_hub"],
                "to_hub": route["to_hub"],
                "tips": route["tips"]
            })
        
        db_routes = self.db.query(TransportMatrix).all()
        for route in db_routes:
            exists = any(
                r["from_city"] == route.from_city and r["to_city"] == route.to_city
                for r in routes
            )
            if not exists:
                routes.append({
                    "from_city": route.from_city,
                    "to_city": route.to_city,
                    "transport_type": route.transport_type,
                    "duration_minutes": route.duration_minutes,
                    "cost_min": route.cost_min,
                    "cost_max": route.cost_max,
                    "frequency": route.frequency,
                    "tips": route.notes
                })
        
        return routes
    
    def recommend_departure_time(
        self,
        plan: ConnectionPlan,
        arrival_time: str = "09:00"
    ) -> Dict:
        try:
            arrival_hour, arrival_min = map(int, arrival_time.split(":"))
            arrival_minutes = arrival_hour * 60 + arrival_min
        except:
            arrival_minutes = 9 * 60
        
        travel_minutes = plan.total_duration_minutes
        departure_minutes = arrival_minutes - travel_minutes - 30
        
        if departure_minutes < 0:
            departure_minutes += 24 * 60
        
        departure_hour = departure_minutes // 60
        departure_min = departure_minutes % 60
        
        if departure_hour >= 24:
            departure_hour -= 24
            day_offset = -1
        else:
            day_offset = 0
        
        return {
            "arrival_time": arrival_time,
            "recommended_departure_time": f"{departure_hour:02d}:{departure_min:02d}",
            "day_offset": day_offset,
            "buffer_minutes": 30,
            "message": f"建议在{departure_hour:02d}:{departure_min:02d}出发，预留30分钟缓冲时间"
        }
