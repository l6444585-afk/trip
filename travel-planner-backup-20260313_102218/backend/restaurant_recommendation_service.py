"""
餐饮智能推荐服务
基于位置、用户偏好、评分等多维度智能推荐餐厅
"""
from typing import List, Dict, Optional, Tuple
from datetime import datetime, date
from sqlalchemy.orm import Session
from dataclasses import dataclass
import math

from enhanced_models import Restaurant, Attraction
from user_profile_service import UserProfileService, PreferenceCategory


@dataclass
class RestaurantRecommendation:
    restaurant: Restaurant
    distance_km: float
    score: float
    match_reasons: List[str]
    warnings: List[str]
    
    def to_dict(self) -> Dict:
        return {
            "id": self.restaurant.id,
            "name": self.restaurant.name,
            "city": self.restaurant.city,
            "address": self.restaurant.address,
            "latitude": self.restaurant.latitude,
            "longitude": self.restaurant.longitude,
            "cuisine_type": self.restaurant.cuisine_type,
            "price_level": self.restaurant.price_level,
            "avg_cost_per_person": self.restaurant.avg_cost_per_person,
            "rating": self.restaurant.rating,
            "specialty_dishes": self.restaurant.specialty_dishes,
            "suitable_for": self.restaurant.suitable_for,
            "tags": self.restaurant.tags,
            "phone": self.restaurant.phone,
            "open_time": self.restaurant.open_time,
            "close_time": self.restaurant.close_time,
            "tips": self.restaurant.tips,
            "distance_km": round(self.distance_km, 2),
            "score": round(self.score, 2),
            "match_reasons": self.match_reasons,
            "warnings": self.warnings
        }


class DietaryFilter:
    """饮食偏好过滤器"""
    
    CUISINE_MAPPING = {
        "不吃辣": {
            "exclude": ["川菜", "湘菜", "重庆火锅", "麻辣烫", "辣子鸡", "水煮鱼"],
            "include": ["江浙菜", "粤菜", "淮扬菜", "本帮菜", "清淡", "素食"],
            "warning": "该餐厅以辣味为主"
        },
        "素食": {
            "exclude": ["烧烤", "火锅", "烤肉", "海鲜"],
            "include": ["素食", "素菜馆", "斋菜"],
            "warning": "该餐厅以肉类/海鲜为主"
        },
        "海鲜过敏": {
            "exclude": ["海鲜", "日料", "刺身", "寿司", "海鲜火锅"],
            "include": [],
            "warning": "该餐厅主打海鲜"
        },
        "不吃海鲜": {
            "exclude": ["海鲜", "日料", "刺身"],
            "include": [],
            "warning": "该餐厅主打海鲜"
        },
        "不吃羊肉": {
            "exclude": ["羊肉", "涮羊肉", "羊肉串", "羊肉汤"],
            "include": [],
            "warning": "该餐厅有羊肉特色菜"
        },
        "清真": {
            "exclude": ["猪肉", "红烧肉", "东坡肉", "排骨"],
            "include": ["清真", "兰州拉面", "新疆菜"],
            "warning": "该餐厅可能含有猪肉"
        }
    }
    
    COMPANION_CUISINE_SUITABILITY = {
        "带老人": {
            "prefer": ["江浙菜", "粤菜", "淮扬菜", "本帮菜", "清淡", "养生"],
            "avoid": ["麻辣", "重口味", "烧烤"],
            "reason": "适合老人的清淡口味"
        },
        "亲子游": {
            "prefer": ["快餐", "简餐", "甜品", "亲子餐厅"],
            "avoid": ["辣", "麻辣"],
            "reason": "适合儿童的口味"
        },
        "情侣出行": {
            "prefer": ["西餐", "日料", "法餐", "浪漫餐厅", "网红店"],
            "avoid": [],
            "reason": "适合情侣的浪漫氛围"
        }
    }
    
    @classmethod
    def filter_by_dietary(
        cls,
        restaurants: List[Restaurant],
        dietary_restrictions: List[str]
    ) -> Tuple[List[Restaurant], Dict[int, List[str]]]:
        if not dietary_restrictions:
            return restaurants, {}
        
        filtered = []
        warnings = {}
        
        for restaurant in restaurants:
            restaurant_warnings = []
            should_include = True
            
            cuisine_type = (restaurant.cuisine_type or "").lower()
            tags = (restaurant.tags or "").lower()
            specialty = (restaurant.specialty_dishes or "").lower()
            combined_text = f"{cuisine_type} {tags} {specialty}"
            
            for restriction in dietary_restrictions:
                rule = cls.CUISINE_MAPPING.get(restriction)
                if not rule:
                    continue
                
                for exclude in rule.get("exclude", []):
                    if exclude.lower() in combined_text:
                        restaurant_warnings.append(rule.get("warning", f"该餐厅可能不适合「{restriction}」"))
                        break
                
                if rule.get("include"):
                    has_preferred = any(inc.lower() in combined_text for inc in rule["include"])
                    if not has_preferred and restaurant_warnings:
                        should_include = False
            
            if should_include:
                filtered.append(restaurant)
                if restaurant_warnings:
                    warnings[restaurant.id] = restaurant_warnings
        
        return filtered, warnings
    
    @classmethod
    def get_companion_preferences(
        cls,
        companion_type: str
    ) -> Tuple[List[str], List[str], str]:
        mapping = cls.COMPANION_CUISINE_SUITABILITY.get(companion_type, {
            "prefer": [],
            "avoid": [],
            "reason": ""
        })
        return mapping["prefer"], mapping["avoid"], mapping["reason"]


class RestaurantScorer:
    """餐厅评分器"""
    
    @staticmethod
    def calculate_score(
        restaurant: Restaurant,
        distance_km: float,
        dietary_restrictions: List[str] = None,
        companion_type: str = None,
        budget_level: str = "medium",
        meal_type: str = "lunch"
    ) -> Tuple[float, List[str]]:
        score = 0.0
        reasons = []
        
        rating = restaurant.rating or 0.0
        score += rating * 20
        if rating >= 4.5:
            reasons.append("高评分餐厅")
        elif rating >= 4.0:
            reasons.append("口碑不错")
        
        if distance_km <= 0.5:
            score += 30
            reasons.append("步行可达")
        elif distance_km <= 1.0:
            score += 20
            reasons.append("距离较近")
        elif distance_km <= 2.0:
            score += 10
        else:
            score -= distance_km * 2
        
        price_level = restaurant.price_level or 2
        avg_cost = restaurant.avg_cost_per_person or 80
        
        if budget_level == "low":
            if price_level <= 2:
                score += 15
                reasons.append("经济实惠")
            elif price_level >= 4:
                score -= 10
        elif budget_level == "high":
            if price_level >= 4:
                score += 10
                reasons.append("高档餐厅")
        else:
            if price_level == 2 or price_level == 3:
                score += 10
        
        if meal_type == "lunch":
            if avg_cost and avg_cost <= 100:
                score += 5
        elif meal_type == "dinner":
            if avg_cost and avg_cost >= 100:
                score += 5
        
        cuisine_type = (restaurant.cuisine_type or "").lower()
        tags = (restaurant.tags or "").lower()
        specialty = (restaurant.specialty_dishes or "").lower()
        combined_text = f"{cuisine_type} {tags} {specialty}"
        
        if companion_type:
            prefer, avoid, reason = DietaryFilter.get_companion_preferences(companion_type)
            for p in prefer:
                if p.lower() in combined_text:
                    score += 10
                    reasons.append(reason)
                    break
            for a in avoid:
                if a.lower() in combined_text:
                    score -= 5
        
        popularity = restaurant.popularity or 0
        if popularity > 1000:
            score += 10
            reasons.append("热门餐厅")
        elif popularity > 500:
            score += 5
        
        return max(0, score), reasons


class RestaurantRecommendationService:
    """餐饮智能推荐服务"""
    
    EARTH_RADIUS_KM = 6371
    
    def __init__(self, db: Session, profile_service: UserProfileService = None):
        self.db = db
        self.profile_service = profile_service
    
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
    
    def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 1.0,
        city: str = None,
        cuisine_type: str = None,
        price_level: int = None,
        limit: int = 20
    ) -> List[Tuple[Restaurant, float]]:
        query = self.db.query(Restaurant).filter(Restaurant.rating > 0)
        
        if city:
            query = query.filter(Restaurant.city == city)
        
        if cuisine_type:
            query = query.filter(
                Restaurant.cuisine_type.ilike(f"%{cuisine_type}%")
            )
        
        if price_level:
            query = query.filter(Restaurant.price_level <= price_level)
        
        restaurants = query.order_by(Restaurant.rating.desc()).limit(100).all()
        
        nearby = []
        for restaurant in restaurants:
            if restaurant.latitude and restaurant.longitude:
                distance = self._haversine_distance(
                    latitude, longitude,
                    restaurant.latitude, restaurant.longitude
                )
                if distance <= radius_km:
                    nearby.append((restaurant, distance))
        
        nearby.sort(key=lambda x: x[1])
        return nearby[:limit]
    
    def recommend_for_location(
        self,
        latitude: float,
        longitude: float,
        user_id: int = None,
        radius_km: float = 1.0,
        meal_type: str = "lunch",
        budget_level: str = "medium",
        limit: int = 5
    ) -> List[RestaurantRecommendation]:
        nearby_restaurants = self.search_nearby(
            latitude, longitude, radius_km, limit=50
        )
        
        if not nearby_restaurants:
            return []
        
        dietary_restrictions = []
        companion_type = None
        
        if user_id and self.profile_service:
            constraints = self.profile_service.get_constraints_for_planning(user_id)
            dietary_restrictions = constraints.get("dietary_restrictions", [])
            companion_type = constraints.get("companion_type")
        
        restaurants = [r for r, _ in nearby_restaurants]
        filtered_restaurants, warnings_map = DietaryFilter.filter_by_dietary(
            restaurants, dietary_restrictions
        )
        
        recommendations = []
        for restaurant, distance in nearby_restaurants:
            if restaurant not in filtered_restaurants:
                continue
            
            score, match_reasons = RestaurantScorer.calculate_score(
                restaurant=restaurant,
                distance_km=distance,
                dietary_restrictions=dietary_restrictions,
                companion_type=companion_type,
                budget_level=budget_level,
                meal_type=meal_type
            )
            
            restaurant_warnings = warnings_map.get(restaurant.id, [])
            
            recommendation = RestaurantRecommendation(
                restaurant=restaurant,
                distance_km=distance,
                score=score,
                match_reasons=match_reasons,
                warnings=restaurant_warnings
            )
            recommendations.append(recommendation)
        
        recommendations.sort(key=lambda x: x.score, reverse=True)
        return recommendations[:limit]
    
    def recommend_for_attraction(
        self,
        attraction: Attraction,
        user_id: int = None,
        meal_type: str = "lunch",
        budget_level: str = "medium",
        limit: int = 5
    ) -> List[RestaurantRecommendation]:
        if not attraction.latitude or not attraction.longitude:
            return []
        
        return self.recommend_for_location(
            latitude=attraction.latitude,
            longitude=attraction.longitude,
            user_id=user_id,
            radius_km=1.0,
            meal_type=meal_type,
            budget_level=budget_level,
            limit=limit
        )
    
    def recommend_by_city(
        self,
        city: str,
        user_id: int = None,
        cuisine_type: str = None,
        price_level: int = None,
        limit: int = 10
    ) -> List[RestaurantRecommendation]:
        query = self.db.query(Restaurant).filter(
            Restaurant.city == city,
            Restaurant.rating > 0
        )
        
        if cuisine_type:
            query = query.filter(
                Restaurant.cuisine_type.ilike(f"%{cuisine_type}%")
            )
        
        if price_level:
            query = query.filter(Restaurant.price_level <= price_level)
        
        restaurants = query.order_by(Restaurant.rating.desc()).limit(30).all()
        
        dietary_restrictions = []
        companion_type = None
        
        if user_id and self.profile_service:
            constraints = self.profile_service.get_constraints_for_planning(user_id)
            dietary_restrictions = constraints.get("dietary_restrictions", [])
            companion_type = constraints.get("companion_type")
        
        filtered_restaurants, warnings_map = DietaryFilter.filter_by_dietary(
            restaurants, dietary_restrictions
        )
        
        recommendations = []
        for restaurant in filtered_restaurants:
            score, match_reasons = RestaurantScorer.calculate_score(
                restaurant=restaurant,
                distance_km=0,
                dietary_restrictions=dietary_restrictions,
                companion_type=companion_type,
                budget_level="medium",
                meal_type="lunch"
            )
            
            restaurant_warnings = warnings_map.get(restaurant.id, [])
            
            recommendation = RestaurantRecommendation(
                restaurant=restaurant,
                distance_km=0,
                score=score,
                match_reasons=match_reasons,
                warnings=restaurant_warnings
            )
            recommendations.append(recommendation)
        
        recommendations.sort(key=lambda x: x.score, reverse=True)
        return recommendations[:limit]
    
    def get_restaurant_detail(
        self,
        restaurant_id: int
    ) -> Optional[Dict]:
        restaurant = self.db.query(Restaurant).filter(
            Restaurant.id == restaurant_id
        ).first()
        
        if not restaurant:
            return None
        
        return {
            "id": restaurant.id,
            "name": restaurant.name,
            "city": restaurant.city,
            "address": restaurant.address,
            "latitude": restaurant.latitude,
            "longitude": restaurant.longitude,
            "category": restaurant.category,
            "cuisine_type": restaurant.cuisine_type,
            "price_level": restaurant.price_level,
            "avg_cost_per_person": restaurant.avg_cost_per_person,
            "rating": restaurant.rating,
            "popularity": restaurant.popularity,
            "review_count": restaurant.review_count,
            "open_time": restaurant.open_time,
            "close_time": restaurant.close_time,
            "closed_days": restaurant.closed_days,
            "specialty_dishes": restaurant.specialty_dishes,
            "suitable_for": restaurant.suitable_for,
            "tags": restaurant.tags,
            "phone": restaurant.phone,
            "image_url": restaurant.image_url,
            "reservation_required": getattr(restaurant, "reservation_required", False),
            "reservation_url": getattr(restaurant, "reservation_url", None),
            "tips": restaurant.tips
        }
    
    def check_restaurant_open(
        self,
        restaurant: Restaurant,
        check_time: datetime = None
    ) -> Dict:
        if check_time is None:
            check_time = datetime.now()
        
        weekday_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        weekday = weekday_names[check_time.weekday()]
        
        closed_days = (restaurant.closed_days or "").split(",")
        if weekday in closed_days:
            return {
                "is_open": False,
                "reason": f"该餐厅{weekday}休息"
            }
        
        open_time = restaurant.open_time or "10:00"
        close_time = restaurant.close_time or "22:00"
        
        if check_time.weekday() >= 5:
            if getattr(restaurant, "open_time_weekend", None):
                open_time = restaurant.open_time_weekend
            if getattr(restaurant, "close_time_weekend", None):
                close_time = restaurant.close_time_weekend
        
        try:
            open_hour, open_min = map(int, open_time.split(":"))
            close_hour, close_min = map(int, close_time.split(":"))
            
            current_minutes = check_time.hour * 60 + check_time.minute
            open_minutes = open_hour * 60 + open_min
            close_minutes = close_hour * 60 + close_min
            
            if close_minutes < open_minutes:
                is_open = current_minutes >= open_minutes or current_minutes <= close_minutes
            else:
                is_open = open_minutes <= current_minutes <= close_minutes
            
            return {
                "is_open": is_open,
                "open_time": open_time,
                "close_time": close_time,
                "current_time": check_time.strftime("%H:%M")
            }
        except:
            return {
                "is_open": True,
                "open_time": open_time,
                "close_time": close_time
            }
    
    def get_meal_recommendations_for_itinerary(
        self,
        attractions: List[Attraction],
        user_id: int = None,
        budget_level: str = "medium"
    ) -> Dict[str, List[RestaurantRecommendation]]:
        meal_recommendations = {
            "lunch": [],
            "dinner": []
        }
        
        if not attractions:
            return meal_recommendations
        
        lunch_attraction = None
        dinner_attraction = None
        
        for attraction in attractions:
            if lunch_attraction is None:
                lunch_attraction = attraction
            dinner_attraction = attraction
        
        if lunch_attraction:
            meal_recommendations["lunch"] = self.recommend_for_attraction(
                attraction=lunch_attraction,
                user_id=user_id,
                meal_type="lunch",
                budget_level=budget_level,
                limit=3
            )
        
        if dinner_attraction:
            meal_recommendations["dinner"] = self.recommend_for_attraction(
                attraction=dinner_attraction,
                user_id=user_id,
                meal_type="dinner",
                budget_level=budget_level,
                limit=3
            )
        
        return meal_recommendations
