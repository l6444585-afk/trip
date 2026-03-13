"""
智能推荐服务模块
基于用户画像和行为的个性化推荐系统
"""
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from collections import defaultdict
import math

logger = logging.getLogger(__name__)


@dataclass
class UserProfile:
    user_id: int
    preferences: Dict[str, float]
    travel_history: List[Dict]
    search_history: List[str]
    favorite_cities: List[str]
    budget_range: tuple
    travel_style: str
    group_type: str


@dataclass
class Recommendation:
    item_id: str
    item_type: str
    name: str
    score: float
    reason: str
    image: str
    tags: List[str]


class RecommendationEngine:
    def __init__(self):
        self.user_profiles: Dict[int, UserProfile] = {}
        self.item_features: Dict[str, Dict] = self._init_item_features()
        self.popular_items: List[Dict] = self._init_popular_items()
    
    def _init_item_features(self) -> Dict[str, Dict]:
        return {
            "杭州西湖": {
                "type": "attraction",
                "city": "杭州",
                "tags": ["自然风光", "人文古迹", "网红打卡"],
                "features": {"自然": 0.8, "文化": 0.7, "休闲": 0.9, "摄影": 0.8},
                "popularity": 0.95,
                "avg_rating": 4.9
            },
            "上海外滩": {
                "type": "attraction",
                "city": "上海",
                "tags": ["都市风情", "夜景", "历史建筑"],
                "features": {"都市": 0.9, "文化": 0.6, "休闲": 0.8, "摄影": 0.9},
                "popularity": 0.92,
                "avg_rating": 4.8
            },
            "苏州拙政园": {
                "type": "attraction",
                "city": "苏州",
                "tags": ["园林艺术", "文化遗产", "摄影圣地"],
                "features": {"自然": 0.6, "文化": 0.9, "休闲": 0.7, "摄影": 0.8},
                "popularity": 0.88,
                "avg_rating": 4.9
            },
            "南京夫子庙": {
                "type": "attraction",
                "city": "南京",
                "tags": ["历史底蕴", "美食打卡", "文化体验"],
                "features": {"文化": 0.8, "美食": 0.9, "休闲": 0.7, "夜游": 0.8},
                "popularity": 0.85,
                "avg_rating": 4.7
            },
            "乌镇古镇": {
                "type": "attraction",
                "city": "嘉兴",
                "tags": ["古镇水乡", "历史文化", "摄影圣地"],
                "features": {"自然": 0.7, "文化": 0.8, "休闲": 0.8, "摄影": 0.9},
                "popularity": 0.87,
                "avg_rating": 4.8
            }
        }
    
    def _init_popular_items(self) -> List[Dict]:
        return [
            {"id": "杭州西湖", "score": 0.95, "trend": "hot"},
            {"id": "上海外滩", "score": 0.92, "trend": "stable"},
            {"id": "苏州拙政园", "score": 0.88, "trend": "rising"},
            {"id": "南京夫子庙", "score": 0.85, "trend": "stable"},
            {"id": "乌镇古镇", "score": 0.87, "trend": "hot"}
        ]
    
    def create_user_profile(
        self,
        user_id: int,
        preferences: Dict[str, float] = None,
        travel_style: str = "休闲型",
        budget_range: tuple = (1000, 5000),
        group_type: str = "个人"
    ) -> UserProfile:
        profile = UserProfile(
            user_id=user_id,
            preferences=preferences or {"自然": 0.5, "文化": 0.5, "美食": 0.5, "休闲": 0.5},
            travel_history=[],
            search_history=[],
            favorite_cities=[],
            budget_range=budget_range,
            travel_style=travel_style,
            group_type=group_type
        )
        self.user_profiles[user_id] = profile
        return profile
    
    def update_user_profile(
        self,
        user_id: int,
        action: str,
        item: str = None,
        rating: float = None
    ):
        if user_id not in self.user_profiles:
            self.create_user_profile(user_id)
        
        profile = self.user_profiles[user_id]
        
        if action == "view" and item:
            if item in self.item_features:
                features = self.item_features[item]["features"]
                for feature, weight in features.items():
                    if feature in profile.preferences:
                        profile.preferences[feature] = (
                            profile.preferences[feature] * 0.9 + weight * 0.1
                        )
        
        elif action == "search" and item:
            profile.search_history.append(item)
            if len(profile.search_history) > 50:
                profile.search_history = profile.search_history[-50:]
        
        elif action == "favorite" and item:
            if item in self.item_features:
                city = self.item_features[item].get("city")
                if city and city not in profile.favorite_cities:
                    profile.favorite_cities.append(city)
        
        elif action == "rating" and item and rating:
            if item in self.item_features:
                features = self.item_features[item]["features"]
                adjustment = (rating - 3) / 10
                for feature in features:
                    if feature in profile.preferences:
                        profile.preferences[feature] = max(0, min(1, 
                            profile.preferences[feature] + adjustment
                        ))
    
    def calculate_similarity(self, profile: UserProfile, item_features: Dict) -> float:
        score = 0.0
        
        item_features_weights = item_features.get("features", {})
        for feature, weight in item_features_weights.items():
            if feature in profile.preferences:
                score += profile.preferences[feature] * weight
        
        if profile.travel_style == "冒险型":
            score += item_features.get("popularity", 0.5) * 0.2
        elif profile.travel_style == "休闲型":
            score += item_features.get("features", {}).get("休闲", 0.5) * 0.3
        elif profile.travel_style == "文化深度型":
            score += item_features.get("features", {}).get("文化", 0.5) * 0.3
        
        score += item_features.get("popularity", 0.5) * 0.2
        score += item_features.get("avg_rating", 4.0) / 5.0 * 0.2
        
        return min(1.0, score)
    
    def get_personalized_recommendations(
        self,
        user_id: int,
        city: str = None,
        limit: int = 10
    ) -> List[Recommendation]:
        if user_id not in self.user_profiles:
            self.create_user_profile(user_id)
        
        profile = self.user_profiles[user_id]
        recommendations = []
        
        for item_name, features in self.item_features.items():
            if city and features.get("city") != city:
                continue
            
            score = self.calculate_similarity(profile, features)
            
            reason = self._generate_reason(profile, features, score)
            
            recommendations.append(Recommendation(
                item_id=item_name,
                item_type=features.get("type", "attraction"),
                name=item_name,
                score=score,
                reason=reason,
                image="",
                tags=features.get("tags", [])
            ))
        
        recommendations.sort(key=lambda x: x.score, reverse=True)
        return recommendations[:limit]
    
    def _generate_reason(
        self,
        profile: UserProfile,
        features: Dict,
        score: float
    ) -> str:
        reasons = []
        
        top_prefs = sorted(
            profile.preferences.items(),
            key=lambda x: x[1],
            reverse=True
        )[:2]
        
        for pref, weight in top_prefs:
            if weight > 0.6 and pref in features.get("features", {}):
                reasons.append(f"符合您对{pref}的偏好")
        
        if features.get("avg_rating", 0) >= 4.8:
            reasons.append("高评分景点")
        
        if features.get("popularity", 0) >= 0.9:
            reasons.append("热门推荐")
        
        if features.get("city") in profile.favorite_cities:
            reasons.append("您喜欢的城市")
        
        return "，".join(reasons[:3]) if reasons else "为您推荐"
    
    def get_similar_items(self, item_name: str, limit: int = 5) -> List[Recommendation]:
        if item_name not in self.item_features:
            return []
        
        target_features = self.item_features[item_name]
        similarities = []
        
        for name, features in self.item_features.items():
            if name == item_name:
                continue
            
            similarity = self._calculate_item_similarity(
                target_features["features"],
                features["features"]
            )
            
            similarities.append(Recommendation(
                item_id=name,
                item_type=features.get("type", "attraction"),
                name=name,
                score=similarity,
                reason="相似推荐",
                image="",
                tags=features.get("tags", [])
            ))
        
        similarities.sort(key=lambda x: x.score, reverse=True)
        return similarities[:limit]
    
    def _calculate_item_similarity(
        self,
        features1: Dict[str, float],
        features2: Dict[str, float]
    ) -> float:
        common_features = set(features1.keys()) & set(features2.keys())
        
        if not common_features:
            return 0.0
        
        dot_product = sum(features1[f] * features2[f] for f in common_features)
        norm1 = math.sqrt(sum(v ** 2 for v in features1.values()))
        norm2 = math.sqrt(sum(v ** 2 for v in features2.values()))
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def get_trending_items(self, limit: int = 10) -> List[Dict]:
        return self.popular_items[:limit]


recommendation_engine = RecommendationEngine()


def get_recommendation_engine() -> RecommendationEngine:
    return recommendation_engine
