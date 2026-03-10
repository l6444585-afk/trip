from typing import List, Dict, Optional
from logger_config import logger
from cache_manager import cache_manager, cached
import random

class RecommendationEngine:
    def __init__(self):
        self.jiangzhehu_attractions = self._initialize_attractions()
        self.special_tags = [
            '小众秘境',
            '美食打卡',
            '古镇水乡',
            '历史文化',
            '自然风光',
            '现代都市',
            '亲子娱乐',
            '艺术体验',
            '网红地标',
            '季节限定'
        ]
    
    def _initialize_attractions(self) -> List[Dict]:
        return [
            {
                'name': '西湖',
                'city': '杭州',
                'category': '自然风光',
                'subcategory': '湖泊',
                'tags': ['小众秘境', '历史文化', '季节限定'],
                'rating': 4.8,
                'best_season': ['春', '夏', '秋'],
                'duration': 240,
                'cost': 0,
                'coordinates': [120.148916, 30.259244]
            },
            {
                'name': '灵隐寺',
                'city': '杭州',
                'category': '历史文化',
                'subcategory': '寺庙',
                'tags': ['历史文化', '小众秘境'],
                'rating': 4.7,
                'best_season': ['春', '秋'],
                'duration': 180,
                'cost': 75,
                'coordinates': [120.101479, 30.241466]
            },
            {
                'name': '宋城',
                'city': '杭州',
                'category': '娱乐',
                'subcategory': '主题公园',
                'tags': ['网红地标', '艺术体验'],
                'rating': 4.6,
                'best_season': ['春', '夏', '秋', '冬'],
                'duration': 300,
                'cost': 300,
                'coordinates': [120.078947, 30.191432]
            },
            {
                'name': '拙政园',
                'city': '苏州',
                'category': '历史文化',
                'subcategory': '园林',
                'tags': ['古镇水乡', '历史文化', '小众秘境'],
                'rating': 4.9,
                'best_season': ['春', '秋'],
                'duration': 180,
                'cost': 80,
                'coordinates': [120.622748, 31.318981]
            },
            {
                'name': '虎丘',
                'city': '苏州',
                'category': '历史文化',
                'subcategory': '古迹',
                'tags': ['历史文化', '小众秘境'],
                'rating': 4.5,
                'best_season': ['春', '秋'],
                'duration': 120,
                'cost': 70,
                'coordinates': [120.572937, 31.337063]
            },
            {
                'name': '平江路',
                'city': '苏州',
                'category': '美食',
                'subcategory': '街区',
                'tags': ['古镇水乡', '美食打卡', '网红地标'],
                'rating': 4.6,
                'best_season': ['春', '夏', '秋'],
                'duration': 180,
                'cost': 0,
                'coordinates': [120.619568, 31.311317]
            },
            {
                'name': '外滩',
                'city': '上海',
                'category': '现代都市',
                'subcategory': '地标',
                'tags': ['现代都市', '网红地标', '季节限定'],
                'rating': 4.8,
                'best_season': ['春', '夏', '秋', '冬'],
                'duration': 120,
                'cost': 0,
                'coordinates': [121.490317, 31.240317]
            },
            {
                'name': '豫园',
                'city': '上海',
                'category': '历史文化',
                'subcategory': '园林',
                'tags': ['历史文化', '古镇水乡'],
                'rating': 4.5,
                'best_season': ['春', '秋'],
                'duration': 120,
                'cost': 40,
                'coordinates': [121.491947, 31.226938]
            },
            {
                'name': '南京路',
                'city': '上海',
                'category': '购物',
                'subcategory': '商业街',
                'tags': ['现代都市', '美食打卡', '网红地标'],
                'rating': 4.4,
                'best_season': ['春', '夏', '秋', '冬'],
                'duration': 180,
                'cost': 0,
                'coordinates': [121.475928, 31.235429]
            },
            {
                'name': '中山陵',
                'city': '南京',
                'category': '历史文化',
                'subcategory': '古迹',
                'tags': ['历史文化', '小众秘境'],
                'rating': 4.7,
                'best_season': ['春', '秋'],
                'duration': 180,
                'cost': 0,
                'coordinates': [118.846733, 32.069748]
            },
            {
                'name': '夫子庙',
                'city': '南京',
                'category': '历史文化',
                'subcategory': '古迹',
                'tags': ['历史文化', '美食打卡', '古镇水乡'],
                'rating': 4.5,
                'best_season': ['春', '夏', '秋'],
                'duration': 180,
                'cost': 0,
                'coordinates': [118.796877, 32.017256]
            },
            {
                'name': '总统府',
                'city': '南京',
                'category': '历史文化',
                'subcategory': '博物馆',
                'tags': ['历史文化', '小众秘境'],
                'rating': 4.6,
                'best_season': ['春', '秋'],
                'duration': 150,
                'cost': 40,
                'coordinates': [118.797779, 32.060255]
            },
            {
                'name': '鼋头渚',
                'city': '无锡',
                'category': '自然风光',
                'subcategory': '公园',
                'tags': ['自然风光', '季节限定', '小众秘境'],
                'rating': 4.7,
                'best_season': ['春', '夏'],
                'duration': 240,
                'cost': 90,
                'coordinates': [120.229447, 31.531747]
            },
            {
                'name': '灵山大佛',
                'city': '无锡',
                'category': '历史文化',
                'subcategory': '寺庙',
                'tags': ['历史文化', '网红地标'],
                'rating': 4.6,
                'best_season': ['春', '秋'],
                'duration': 180,
                'cost': 210,
                'coordinates': [120.118011, 31.424489]
            },
            {
                'name': '天一阁',
                'city': '宁波',
                'category': '历史文化',
                'subcategory': '园林',
                'tags': ['历史文化', '小众秘境', '古镇水乡'],
                'rating': 4.6,
                'best_season': ['春', '秋'],
                'duration': 120,
                'cost': 30,
                'coordinates': [121.550842, 29.874417]
            },
            {
                'name': '老外滩',
                'city': '宁波',
                'category': '现代都市',
                'subcategory': '地标',
                'tags': ['现代都市', '美食打卡', '网红地标'],
                'rating': 4.4,
                'best_season': ['春', '夏', '秋'],
                'duration': 120,
                'cost': 0,
                'coordinates': [121.565242, 29.868237]
            }
        ]
    
    def calculate_interest_match_score(
        self,
        user_interests: List[str],
        attraction_tags: List[str]
    ) -> float:
        if not user_interests:
            return 0.5
        
        interest_mapping = {
            '美食': ['美食打卡'],
            '人文历史': ['历史文化', '古镇水乡'],
            '自然风光': ['自然风光', '小众秘境'],
            '购物': ['现代都市', '网红地标'],
            '夜生活': ['网红地标', '现代都市'],
            '亲子娱乐': ['亲子娱乐', '艺术体验'],
            '户外运动': ['自然风光', '小众秘境'],
            '艺术文化': ['艺术体验', '历史文化']
        }
        
        match_count = 0
        total_interests = len(user_interests)
        
        for interest in user_interests:
            mapped_tags = interest_mapping.get(interest, [])
            for tag in mapped_tags:
                if tag in attraction_tags:
                    match_count += 1
        
        return match_count / total_interests if total_interests > 0 else 0
    
    def calculate_companion_score(
        self,
        companion_type: str,
        attraction: Dict
    ) -> float:
        companion_preferences = {
            '情侣': ['网红地标', '小众秘境', '艺术体验'],
            '亲子': ['亲子娱乐', '自然风光', '现代都市'],
            '独行': ['历史文化', '小众秘境', '艺术体验'],
            '朋友': ['网红地标', '美食打卡', '现代都市'],
            '家庭': ['历史文化', '自然风光', '古镇水乡']
        }
        
        preferred_tags = companion_preferences.get(companion_type, [])
        match_count = sum(1 for tag in preferred_tags if tag in attraction['tags'])
        
        return match_count / len(preferred_tags) if preferred_tags else 0.5
    
    def calculate_budget_score(
        self,
        user_budget: float,
        attraction_cost: float,
        days: int
    ) -> float:
        daily_budget = user_budget / days
        
        if attraction_cost == 0:
            return 1.0
        
        if attraction_cost <= daily_budget * 0.3:
            return 1.0
        elif attraction_cost <= daily_budget * 0.5:
            return 0.8
        elif attraction_cost <= daily_budget * 0.7:
            return 0.6
        elif attraction_cost <= daily_budget:
            return 0.4
        else:
            return 0.2
    
    def calculate_season_score(
        self,
        current_season: str,
        attraction_best_seasons: List[str]
    ) -> float:
        if not attraction_best_seasons:
            return 0.5
        
        if current_season in attraction_best_seasons:
            return 1.0
        else:
            return 0.5
    
    def recommend_attractions(
        self,
        user_interests: List[str],
        companion_type: str,
        budget: float,
        days: int,
        departure: str,
        current_season: str = '春',
        limit: int = 10
    ) -> List[Dict]:
        logger.info(f"Generating recommendations for {departure}, interests: {user_interests}")
        
        scored_attractions = []
        
        for attraction in self.jiangzhehu_attractions:
            if departure and departure != attraction['city']:
                continue
            
            interest_score = self.calculate_interest_match_score(
                user_interests,
                attraction['tags']
            )
            
            companion_score = self.calculate_companion_score(
                companion_type,
                attraction
            )
            
            budget_score = self.calculate_budget_score(
                budget,
                attraction['cost'],
                days
            )
            
            season_score = self.calculate_season_score(
                current_season,
                attraction['best_season']
            )
            
            total_score = (
                interest_score * 0.4 +
                companion_score * 0.2 +
                budget_score * 0.2 +
                season_score * 0.1 +
                attraction['rating'] / 5 * 0.1
            )
            
            scored_attractions.append({
                **attraction,
                'recommendation_score': round(total_score, 3),
                'match_reasons': self._generate_match_reasons(
                    interest_score,
                    companion_score,
                    budget_score,
                    season_score
                )
            })
        
        scored_attractions.sort(
            key=lambda x: x['recommendation_score'],
            reverse=True
        )
        
        return scored_attractions[:limit]
    
    def _generate_match_reasons(
        self,
        interest_score: float,
        companion_score: float,
        budget_score: float,
        season_score: float
    ) -> List[str]:
        reasons = []
        
        if interest_score >= 0.7:
            reasons.append('符合您的兴趣偏好')
        if companion_score >= 0.7:
            reasons.append('适合您的同行人员')
        if budget_score >= 0.8:
            reasons.append('在您的预算范围内')
        if season_score >= 0.8:
            reasons.append('当前季节最佳游览时间')
        
        return reasons
    
    def get_special_tags(self) -> List[Dict]:
        tag_descriptions = {
            '小众秘境': '人少景美、独特体验的隐秘景点',
            '美食打卡': '当地特色美食、网红餐厅推荐',
            '古镇水乡': '江南水乡风情、古镇古村',
            '历史文化': '历史遗迹、文化场馆、博物馆',
            '自然风光': '山水景观、公园绿地、自然美景',
            '现代都市': '购物娱乐、城市地标、现代建筑',
            '亲子娱乐': '适合家庭出游的景点和活动',
            '艺术体验': '博物馆、艺术展览、文化创意',
            '网红地标': '热门打卡点、社交媒体热门',
            '季节限定': '特定季节才能体验的特色活动'
        }
        
        return [
            {
                'tag': tag,
                'description': tag_descriptions[tag],
                'icon': self._get_tag_icon(tag)
            }
            for tag in self.special_tags
        ]
    
    def _get_tag_icon(self, tag: str) -> str:
        tag_icons = {
            '小众秘境': '🌟',
            '美食打卡': '🍜',
            '古镇水乡': '🏘️',
            '历史文化': '🏛️',
            '自然风光': '🌄',
            '现代都市': '🌆',
            '亲子娱乐': '👨‍👩‍👧‍👦',
            '艺术体验': '🎨',
            '网红地标': '📸',
            '季节限定': '🍂'
        }
        return tag_icons.get(tag, '📍')

recommendation_engine = RecommendationEngine()
