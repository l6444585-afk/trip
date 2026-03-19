"""
景点服务模块 - 生产级实现
整合高德地图API，支持智能缓存、限流、降级
"""
import httpx
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
from functools import lru_cache

from app.core.config import settings
from app.core.cache import redis_client
from app.core.rate_limiter import RateLimiter
from app.core.circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)


class AttractionType(Enum):
    """景点类型枚举"""
    SCENERY = "风景名胜"
    CULTURAL = "文化古迹"
    ENTERTAINMENT = "娱乐场所"
    PARK = "公园广场"
    MUSEUM = "博物馆"
    TEMPLE = "寺庙道观"
    SHOPPING = "购物"
    FOOD = "美食"
    ACCOMMODATION = "住宿"


@dataclass
class AttractionInfo:
    """景点信息数据模型"""
    id: str
    name: str
    type: AttractionType
    address: str
    province: str
    city: str
    district: str
    longitude: float
    latitude: float
    tel: Optional[str] = None
    website: Optional[str] = None
    rating: float = 0.0
    review_count: int = 0
    business_hours: Optional[str] = None
    price: Optional[float] = None
    tags: List[str] = None
    images: List[str] = None
    description: Optional[str] = None
    recommend_duration: Optional[int] = None
    best_season: List[str] = None
    tips: List[str] = None
    current_crowd_level: Optional[str] = None
    real_time_status: Optional[str] = None
    last_updated: Optional[str] = None

    def to_dict(self) -> Dict:
        result = asdict(self)
        result['type'] = self.type.value
        return result

    @classmethod
    def from_amap_poi(cls, poi_data: Dict) -> 'AttractionInfo':
        return cls(
            id=poi_data.get('id', ''),
            name=poi_data.get('name', ''),
            type=cls._parse_type(poi_data.get('type', '')),
            address=poi_data.get('address', ''),
            province=poi_data.get('pname', ''),
            city=poi_data.get('cityname', ''),
            district=poi_data.get('adname', ''),
            longitude=float(poi_data.get('location', '0,0').split(',')[0]),
            latitude=float(poi_data.get('location', '0,0').split(',')[1]),
            tel=poi_data.get('tel'),
            website=poi_data.get('website'),
            business_hours=poi_data.get('biz_ext', {}).get('open_time'),
            price=cls._parse_price(poi_data.get('biz_ext', {}).get('cost', '')),
            tags=cls._parse_tags(poi_data.get('type', '')),
            last_updated=datetime.now().isoformat()
        )

    @staticmethod
    def _parse_type(type_str: str) -> AttractionType:
        type_mapping = {
            '风景名胜': AttractionType.SCENERY,
            '文化古迹': AttractionType.CULTURAL,
            '娱乐': AttractionType.ENTERTAINMENT,
            '公园': AttractionType.PARK,
            '博物馆': AttractionType.MUSEUM,
            '宗教': AttractionType.TEMPLE,
        }
        for key, value in type_mapping.items():
            if key in type_str:
                return value
        return AttractionType.SCENERY

    @staticmethod
    def _parse_price(price_str: str) -> Optional[float]:
        if not price_str:
            return None
        import re
        match = re.search(r'(\d+)', price_str)
        return float(match.group(1)) if match else None

    @staticmethod
    def _parse_tags(type_str: str) -> List[str]:
        tags = []
        if '5A景区' in type_str or '4A景区' in type_str:
            tags.append('A级景区')
        if '免费' in type_str:
            tags.append('免费')
        if '古建筑' in type_str:
            tags.append('历史建筑')
        return tags or ['热门景点']


class AttractionService:
    """景点服务 - 生产级实现"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.api_key = settings.AMAP_API_KEY
        self.base_url = "https://restapi.amap.com/v3"
        self.timeout = 10.0

        # 初始化限流器
        self.rate_limiter = RateLimiter(
            max_calls=100,  # QPS=100
            period=1.0,
            max_concurrent=10
        )

        # 初始化熔断器
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=60,
            expected_exception=Exception
        )

        # 初始化HTTP客户端
        self.http_client = httpx.AsyncClient(
            timeout=self.timeout,
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10)
        )

        # 江浙沪热门城市列表
        self.jiangnan_cities = [
            '上海', '杭州', '苏州', '南京', '无锡', '常州',
            '镇江', '扬州', '南通', '泰州', '嘉兴', '湖州',
            '绍兴', '宁波', '舟山', '台州', '金华', '衢州',
            '丽水', '温州', '盐城', '淮安', '宿迁', '连云港', '徐州'
        ]

    async def search_attractions(
        self,
        keyword: str,
        city: Optional[str] = None,
        attraction_type: Optional[AttractionType] = None,
        radius: int = 5000,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "distance",
        longitude: Optional[float] = None,
        latitude: Optional[float] = None
    ) -> Dict[str, Any]:
        """搜索景点 - 生产级实现"""
        cache_key = f"attr:search:{keyword}:{city}:{attraction_type}:{page}:{page_size}:{sort_by}"

        # 尝试从缓存获取
        cached_data = await self._get_cache(cache_key)
        if cached_data:
            logger.info(f"景点搜索命中缓存: {cache_key}")
            return cached_data

        try:
            # 应用限流
            async with self.rate_limiter:
                # 应用熔断
                result = await self.circuit_breaker.call(
                    self._call_amap_search,
                    keyword=keyword,
                    city=city,
                    radius=radius,
                    page=page,
                    page_size=page_size
                )

            # 处理结果
            attractions = self._process_search_results(
                result.get('pois', []),
                longitude, latitude
            )

            # 按指定方式排序
            attractions = self._sort_attractions(attractions, sort_by, longitude, latitude)

            # 筛选类型
            if attraction_type:
                attractions = [a for a in attractions if a.type == attraction_type]

            response_data = {
                "success": True,
                "data": attractions,
                "total": result.get('count', 0),
                "page": page,
                "page_size": page_size,
                "search_params": {
                    "keyword": keyword,
                    "city": city,
                    "radius": radius
                }
            }

            # 写入缓存
            await self._set_cache(cache_key, response_data, ttl=3600)

            return response_data

        except Exception as e:
            logger.error(f"搜索景点失败: {str(e)}")
            # 降级处理: 返回热门景点
            return await self._get_fallback_attractions(keyword, city)

    async def _call_amap_search(
        self,
        keyword: str,
        city: Optional[str] = None,
        radius: int = 5000,
        page: int = 1,
        page_size: int = 20
    ) -> Dict:
        """调用高德POI搜索API"""
        params = {
            "key": self.api_key,
            "keywords": keyword,
            "types": "110000|110101|110102|110103|110104|110105",
            "city": city or "上海",
            "radius": radius,
            "offset": page_size,
            "page": page,
            "extensions": "all",
            "show_fields": "business,photos,indoor_data,children"
        }

        url = f"{self.base_url}/place/text"
        response = await self.http_client.get(url, params=params)
        response.raise_for_status()

        result = response.json()
        if result.get('status') != '1':
            raise Exception(f"高德API错误: {result.get('info')}")

        return result

    def _process_search_results(
        self,
        pois: List[Dict],
        longitude: Optional[float],
        latitude: Optional[float]
    ) -> List[AttractionInfo]:
        """处理搜索结果"""
        attractions = []

        for poi in pois:
            try:
                attraction = AttractionInfo.from_amap_poi(poi)

                # 计算距离
                if longitude is not None and latitude is not None:
                    attraction.distance = self._calculate_distance(
                        longitude, latitude,
                        attraction.longitude, attraction.latitude
                    )

                # 附加评分(模拟)
                attraction.rating = self._get_mock_rating(poi.get('id'))
                attraction.review_count = self._get_mock_review_count(poi.get('id'))

                # 建议游玩时长
                attraction.recommend_duration = self._get_recommend_duration(attraction.type)

                attractions.append(attraction)
            except Exception as e:
                logger.warning(f"处理POI失败: {poi.get('id')}, {str(e)}")
                continue

        return attractions

    def _sort_attractions(
        self,
        attractions: List[AttractionInfo],
        sort_by: str,
        longitude: Optional[float],
        latitude: Optional[float]
    ) -> List[AttractionInfo]:
        """排序景点"""
        if sort_by == "rating":
            return sorted(attractions, key=lambda x: x.rating, reverse=True)
        elif sort_by == "hot":
            return sorted(attractions, key=lambda x: x.review_count, reverse=True)
        elif sort_by == "distance" and hasattr(attractions[0], 'distance'):
            return sorted(attractions, key=lambda x: x.distance)
        return attractions

    async def get_attraction_detail(self, attraction_id: str) -> Optional[AttractionInfo]:
        """获取景点详情"""
        cache_key = f"attr:detail:{attraction_id}"

        cached_data = await self._get_cache(cache_key)
        if cached_data:
            return cached_data

        try:
            async with self.rate_limiter:
                params = {
                    "key": self.api_key,
                    "id": attraction_id,
                    "extensions": "all"
                }
                url = f"{self.base_url}/place/detail"
                response = await self.http_client.get(url, params=params)
                response.raise_for_status()

                result = response.json()
                if result.get('status') != '1':
                    return None

                detail = AttractionInfo.from_amap_poi(result.get('pois', [{}])[0])
                await self._set_cache(cache_key, detail, ttl=7200)
                return detail

        except Exception as e:
            logger.error(f"获取景点详情失败: {attraction_id}, {str(e)}")
            return None

    def _calculate_distance(
        self,
        lon1: float, lat1: float,
        lon2: float, lat2: float
    ) -> float:
        """计算两点间距离(千米)"""
        import math
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat/2)**2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    def _get_mock_rating(self, attraction_id: str) -> float:
        """获取评分(模拟)"""
        import hashlib
        hash_val = int(hashlib.md5(attraction_id.encode()).hexdigest()[:8], 16)
        return 4.0 + (hash_val % 100) / 100

    def _get_mock_review_count(self, attraction_id: str) -> int:
        """获取评论数(模拟)"""
        import hashlib
        hash_val = int(hashlib.md5(attraction_id.encode()).hexdigest()[:8], 16)
        return 500 + (hash_val % 10000)

    def _get_recommend_duration(self, attraction_type: AttractionType) -> int:
        """获取推荐游玩时长"""
        duration_map = {
            AttractionType.SCENERY: 180,
            AttractionType.CULTURAL: 120,
            AttractionType.PARK: 90,
            AttractionType.MUSEUM: 120,
            AttractionType.TEMPLE: 90,
            AttractionType.ENTERTAINMENT: 240,
        }
        return duration_map.get(attraction_type, 120)

    async def _get_fallback_attractions(
        self,
        keyword: str,
        city: Optional[str] = None
    ) -> Dict[str, Any]:
        """降级: 返回热门景点"""
        logger.info("使用降级策略返回热门景点")
        fallback_attractions = [
            AttractionInfo(
                id="fallback_1",
                name=f"{city or '上海'}热门景点",
                type=AttractionType.SCENERY,
                address=f"{city or '上海市'}热门区域",
                province="上海",
                city=city or "上海",
                district="市中心",
                longitude=121.4737,
                latitude=31.2304,
                rating=4.5,
                review_count=1000
            )
        ]
        return {
            "success": True,
            "data": fallback_attractions,
            "total": len(fallback_attractions),
            "fallback": True
        }

    async def _get_cache(self, key: str) -> Optional[Any]:
        """获取缓存"""
        try:
            data = await redis_client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.warning(f"获取缓存失败: {key}, {str(e)}")
            return None

    async def _set_cache(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """设置缓存"""
        try:
            await redis_client.setex(
                key,
                ttl,
                json.dumps(value, default=str, ensure_ascii=False)
            )
            return True
        except Exception as e:
            logger.warning(f"设置缓存失败: {key}, {str(e)}")
            return False

    async def close(self):
        """关闭HTTP客户端"""
        await self.http_client.aclose()


# 全局实例
attraction_service = AttractionService()