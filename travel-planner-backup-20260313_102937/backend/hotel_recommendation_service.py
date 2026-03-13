"""
酒店推荐服务
整合高德地图API，支持多平台预订跳转
适用于个人开发者（无需飞猪API权限）
"""
import os
import math
import asyncio
import random
import logging
import time
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date, timedelta
from dataclasses import dataclass, field
from enum import Enum
import json
import httpx
from urllib.parse import quote
from dotenv import load_dotenv

from taobao_client import FliggyCPSClient, FliggyHotelSearchClient, TaobaoAPIError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

load_dotenv()

_hotel_cache: Dict[str, Tuple[List, float]] = {}
CACHE_TTL = 300

def get_cache_key(latitude: float, longitude: float, city: str, radius: int) -> str:
    return f"{city}_{latitude:.4f}_{longitude:.4f}_{radius}"

def get_cached_hotels(key: str) -> Optional[List]:
    if key in _hotel_cache:
        data, timestamp = _hotel_cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return data
        del _hotel_cache[key]
    return None

def set_cached_hotels(key: str, data: List) -> None:
    _hotel_cache[key] = (data, time.time())


class HotelSource(Enum):
    FLIGGY = "fliggy"
    AMAP = "amap"
    MOCK = "mock"


class BookingPlatform(Enum):
    FLIGGY = "fliggy"
    CTRIP = "ctrip"
    MEITUAN = "meituan"
    QUNAR = "qunar"


@dataclass
class Hotel:
    """酒店信息模型"""
    id: str
    name: str
    address: str
    city: str
    latitude: float
    longitude: float
    rating: Optional[float] = None
    star_rating: Optional[int] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    price_currency: str = "CNY"
    distance_km: Optional[float] = None
    image_url: Optional[str] = None
    amenities: List[str] = field(default_factory=list)
    description: Optional[str] = None
    phone: Optional[str] = None
    source: str = "amap"
    sh_id: Optional[str] = None
    booking_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    booking_links: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "city": self.city,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "rating": self.rating,
            "star_rating": self.star_rating,
            "price_min": self.price_min,
            "price_max": self.price_max,
            "price_currency": self.price_currency,
            "distance_km": round(self.distance_km, 2) if self.distance_km else None,
            "image_url": self.image_url,
            "amenities": self.amenities,
            "description": self.description,
            "phone": self.phone,
            "source": self.source,
            "sh_id": self.sh_id,
            "booking_url": self.booking_url,
            "qr_code_url": self.qr_code_url,
            "booking_links": self.booking_links
        }


@dataclass
class HotelPriceInfo:
    """酒店价格信息"""
    hotel_id: str
    check_in: str
    check_out: str
    room_type: str
    price: int
    price_unit: str = "分"
    available: bool = True
    booking_url: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        price_yuan = self.price / 100 if self.price_unit == "分" else self.price
        return {
            "hotel_id": self.hotel_id,
            "check_in": self.check_in,
            "check_out": self.check_out,
            "room_type": self.room_type,
            "price": price_yuan,
            "price_unit": "元",
            "available": self.available,
            "booking_url": self.booking_url
        }


class HotelRecommendationService:
    """
    酒店推荐服务
    
    功能:
    1. 基于景点位置推荐附近酒店
    2. 基于行程规划推荐酒店
    3. 获取酒店实时价格
    4. 多数据源整合（飞猪 + 高德）
    """
    
    DEFAULT_HOTEL_IMAGES = [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    ]
    
    CUSTOM_HOTEL_IMAGES = {
        "JOandJOE": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
        "武林门店": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
        "榴园宾馆": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
        "榴花寓": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
    }
    
    JIANGNAN_CITIES = {
        "上海": {"city_id": "310100", "center": (31.2304, 121.4737)},
        "杭州": {"city_id": "330100", "center": (30.2741, 120.1551)},
        "苏州": {"city_id": "320500", "center": (31.2990, 120.5853)},
        "南京": {"city_id": "320100", "center": (32.0603, 118.7969)},
        "无锡": {"city_id": "320200", "center": (31.4912, 120.3119)},
        "宁波": {"city_id": "330200", "center": (29.8683, 121.5440)},
        "绍兴": {"city_id": "330600", "center": (30.0326, 120.5820)},
        "嘉兴": {"city_id": "330400", "center": (30.7468, 120.7507)},
        "湖州": {"city_id": "330500", "center": (30.8672, 120.0868)},
        "扬州": {"city_id": "321000", "center": (32.3912, 119.4129)},
        "常州": {"city_id": "320400", "center": (31.8122, 119.9692)},
        "镇江": {"city_id": "321100", "center": (32.1875, 119.4250)},
        "南通": {"city_id": "320600", "center": (32.0146, 120.8945)},
        "舟山": {"city_id": "330900", "center": (29.9853, 122.2072)},
    }
    
    def __init__(
        self,
        db: Optional[Session] = None,
        use_fliggy: bool = True,
        use_amap: bool = True
    ):
        self.db = db
        self.use_fliggy = use_fliggy
        self.use_amap = use_amap
        
        self.amap_api_key = os.getenv("AMAP_API_KEY", "")
        
        self.fliggy_client = None
        if use_fliggy:
            app_key = os.getenv("TAOBAO_APP_KEY")
            app_secret = os.getenv("TAOBAO_APP_SECRET")
            if app_key and app_secret:
                self.fliggy_client = FliggyCPSClient(app_key, app_secret)
    
    def _get_default_hotel_image(self, hotel_name: str = "") -> str:
        """
        根据酒店名称获取默认图片
        优先使用自定义图片，否则使用酒店名称的哈希值来选择图片
        """
        if hotel_name:
            for keyword, image_url in self.CUSTOM_HOTEL_IMAGES.items():
                if keyword in hotel_name:
                    return image_url
            hash_value = sum(ord(c) for c in hotel_name)
            index = hash_value % len(self.DEFAULT_HOTEL_IMAGES)
            return self.DEFAULT_HOTEL_IMAGES[index]
        return random.choice(self.DEFAULT_HOTEL_IMAGES)
    
    def _calculate_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        计算两点之间的距离（公里）
        使用Haversine公式
        """
        R = 6371
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    async def search_hotels_amap(
        self,
        latitude: float,
        longitude: float,
        radius: int = 3000,
        keywords: Optional[str] = None,
        city: Optional[str] = None,
        city_limit: bool = True,
        page_size: int = 60,
        max_retries: int = 3
    ) -> List[Hotel]:
        """
        使用高德地图API搜索附近酒店
        
        Args:
            latitude: 纬度
            longitude: 经度
            radius: 搜索半径（米），默认3000，会自动扩大以获取更多结果
            keywords: 搜索关键词
            city: 城市名称
            city_limit: 是否限制城市内
            page_size: 返回数量（最大60）
            max_retries: 最大重试次数
        
        Returns:
            酒店列表
        """
        if not self.amap_api_key:
            return []
        
        cache_key = get_cache_key(latitude, longitude, city or "", radius)
        cached = get_cached_hotels(cache_key)
        if cached:
            logger.info(f"使用缓存数据: {cache_key}")
            return cached[:page_size]
        
        url = "https://restapi.amap.com/v3/place/around"
        
        all_hotels = []
        max_per_page = 25
        total_needed = min(page_size, 60)
        
        search_radii = [radius, radius * 2, radius * 4]
        
        async def fetch_with_retry(params: dict, page: int, retry_count: int = 0) -> List[Hotel]:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    data = response.json()
                    
                    if data.get("status") != "1":
                        error_info = data.get("info", "未知错误")
                        logger.warning(f"高德地图API返回错误: {error_info}")
                        if retry_count < max_retries:
                            await asyncio.sleep(0.5 * (retry_count + 1))
                            return await fetch_with_retry(params, page, retry_count + 1)
                        return []
                    
                    pois = data.get("pois", [])
                    hotels = []
                    
                    for poi in pois:
                        location = poi.get("location", "").split(",")
                        if len(location) != 2:
                            continue
                        
                        lon, lat = float(location[0]), float(location[1])
                        distance = self._calculate_distance(latitude, longitude, lat, lon)
                        
                        biz_ext = poi.get("biz_ext", {})
                        rating_str = biz_ext.get("rating", "") if isinstance(biz_ext, dict) else ""
                        try:
                            rating = float(rating_str) if rating_str else None
                        except (ValueError, TypeError):
                            rating = None
                        
                        cost_str = biz_ext.get("cost", "") if isinstance(biz_ext, dict) else ""
                        price_min = None
                        price_max = None
                        if cost_str:
                            try:
                                cost_parts = cost_str.replace(" ", "").split("-")
                                if len(cost_parts) >= 2:
                                    price_min = int(float(cost_parts[0]))
                                    price_max = int(float(cost_parts[1]))
                                elif len(cost_parts) == 1 and cost_parts[0]:
                                    price_min = int(float(cost_parts[0]))
                            except (ValueError, TypeError):
                                pass
                        
                        photos = poi.get("photos", [])
                        image_url = None
                        if photos and len(photos) > 0:
                            first_photo = photos[0]
                            if isinstance(first_photo, dict):
                                image_url = first_photo.get("url")
                            elif isinstance(first_photo, str):
                                image_url = first_photo
                        
                        hotel_name = poi.get("name", "")
                        custom_image = None
                        for keyword, img_url in self.CUSTOM_HOTEL_IMAGES.items():
                            if keyword in hotel_name:
                                custom_image = img_url
                                break
                        if custom_image:
                            image_url = custom_image
                        elif not image_url:
                            image_url = self._get_default_hotel_image(hotel_name)
                        
                        hotel = Hotel(
                            id=f"amap_{poi.get('id', '')}",
                            name=hotel_name,
                            address=poi.get("address", "") or poi.get("pname", "") + poi.get("cityname", "") + poi.get("adname", ""),
                            city=poi.get("cityname", ""),
                            latitude=lat,
                            longitude=lon,
                            rating=rating,
                            star_rating=self._parse_star_rating(poi.get("typecode", "")),
                            price_min=price_min,
                            price_max=price_max,
                            distance_km=distance,
                            image_url=image_url,
                            amenities=self._parse_amap_amenities(biz_ext if isinstance(biz_ext, dict) else {}),
                            phone=poi.get("tel", ""),
                            source="amap"
                        )
                        hotels.append(hotel)
                    
                    return hotels
                    
            except httpx.TimeoutException:
                logger.warning(f"高德地图API调用超时 (第{page}页, 重试{retry_count + 1}/{max_retries})")
                if retry_count < max_retries:
                    await asyncio.sleep(1.0 * (retry_count + 1))
                    return await fetch_with_retry(params, page, retry_count + 1)
                return []
            except httpx.HTTPStatusError as e:
                logger.error(f"高德地图API调用失败: {str(e)} (第{page}页)")
                if retry_count < max_retries:
                    await asyncio.sleep(1.0 * (retry_count + 1))
                    return await fetch_with_retry(params, page, retry_count + 1)
                return []
            except Exception as e:
                logger.error(f"高德地图API调用异常: {str(e)} (第{page}页)")
                if retry_count < max_retries:
                    await asyncio.sleep(1.0 * (retry_count + 1))
                    return await fetch_with_retry(params, page, retry_count + 1)
                return []
        
        for search_radius in search_radii:
            if len(all_hotels) >= total_needed:
                break
                
            pages_needed = 3
            
            tasks = []
            for page in range(1, pages_needed + 1):
                params = {
                    "key": self.amap_api_key,
                    "location": f"{longitude},{latitude}",
                    "keywords": keywords or "酒店",
                    "radius": search_radius,
                    "sortrule": "distance",
                    "offset": max_per_page,
                    "page": page,
                    "extensions": "all"
                }
                
                if city:
                    params["city"] = city
                    params["citylimit"] = "true" if city_limit else "false"
                
                tasks.append(fetch_with_retry(params, page))
            
            results = await asyncio.gather(*tasks)
            
            for hotels in results:
                all_hotels.extend(hotels)
        
        seen_ids = set()
        unique_hotels = []
        for hotel in all_hotels:
            if hotel.id not in seen_ids:
                seen_ids.add(hotel.id)
                unique_hotels.append(hotel)
        
        unique_hotels.sort(key=lambda h: h.distance_km or float("inf"))
        
        if unique_hotels:
            set_cached_hotels(cache_key, unique_hotels)
        
        return unique_hotels[:total_needed]
    
    def _parse_star_rating(self, typecode: str) -> Optional[int]:
        """解析高德地图酒店星级"""
        star_mapping = {
            "100101": 5,
            "100102": 4,
            "100103": 3,
            "100104": 2,
            "100105": 1,
        }
        return star_mapping.get(typecode[:6])
    
    def _parse_amap_amenities(self, biz_ext: Dict) -> List[str]:
        """解析高德地图酒店设施"""
        amenities = []
        if biz_ext.get("wifi") == "1":
            amenities.append("WiFi")
        if biz_ext.get("parking") == "1":
            amenities.append("停车场")
        if biz_ext.get("restaurant") == "1":
            amenities.append("餐厅")
        return amenities
    
    def generate_booking_links(
        self,
        hotel_name: str,
        city: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> Dict[str, str]:
        """
        生成多平台预订链接
        
        Args:
            hotel_name: 酒店名称
            city: 城市名称
            check_in: 入住日期
            check_out: 离店日期
            latitude: 纬度
            longitude: 经度
        
        Returns:
            各平台预订链接字典
        """
        encoded_name = quote(hotel_name)
        encoded_city = quote(city)
        
        links = {}
        
        links["fliggy"] = f"https://www.fliggy.com/hotel/search?keyword={encoded_name}&city={encoded_city}"
        
        links["ctrip"] = f"https://hotels.ctrip.com/hotels/list?city={encoded_city}&keyword={encoded_name}"
        
        links["meituan"] = f"https://hotel.meituan.com/{encoded_city}/?q={encoded_name}"
        
        links["qunar"] = f"https://hotel.qunar.com/cn/{encoded_city}/?q={encoded_name}"
        
        if check_in and check_out:
            try:
                ci = datetime.strptime(check_in, "%Y-%m-%d")
                co = datetime.strptime(check_out, "%Y-%m-%d")
                ci_str = ci.strftime("%Y-%m-%d")
                co_str = co.strftime("%Y-%m-%d")
                
                links["fliggy"] += f"&checkIn={ci_str}&checkOut={co_str}"
                links["ctrip"] += f"&checkin={ci_str}&checkout={co_str}"
                links["meituan"] += f"&checkin={ci_str}&checkout={co_str}"
            except (ValueError, TypeError) as e:
                logger.warning(f"日期格式解析失败: {str(e)}")
        
        return links
    
    def generate_mock_hotels(
        self,
        city: str,
        latitude: float,
        longitude: float,
        count: int = 10,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None
    ) -> List[Hotel]:
        """
        生成模拟酒店数据（当API不可用时使用）
        
        Args:
            city: 城市名称
            latitude: 中心纬度
            longitude: 中心经度
            count: 生成数量
            check_in: 入住日期
            check_out: 离店日期
        
        Returns:
            模拟酒店列表
        """
        hotel_chains = [
            "如家酒店", "汉庭酒店", "7天酒店", "锦江之星", "格林豪泰",
            "全季酒店", "亚朵酒店", "维也纳酒店", "希尔顿酒店", "万豪酒店",
            "洲际酒店", "香格里拉酒店", "喜来登酒店", "凯悦酒店", "皇冠假日酒店"
        ]
        
        hotel_types = ["酒店", "大酒店", "国际酒店", "精品酒店", "商务酒店"]
        
        locations = ["市中心店", "火车站店", "景区店", "商业区店", "机场店", "万达广场店", "西湖店", "外滩店"]
        
        amenities_pool = [
            ["WiFi", "停车场", "餐厅", "健身房"],
            ["WiFi", "停车场", "早餐", "会议室"],
            ["WiFi", "停车场", "餐厅", "游泳池"],
            ["WiFi", "停车场", "早餐", "健身房", "SPA"],
            ["WiFi", "停车场", "餐厅", "会议室", "商务中心"]
        ]
        
        hotels = []
        
        for i in range(count):
            lat_offset = random.uniform(-0.05, 0.05)
            lon_offset = random.uniform(-0.05, 0.05)
            hotel_lat = latitude + lat_offset
            hotel_lon = longitude + lon_offset
            
            distance = self._calculate_distance(latitude, longitude, hotel_lat, hotel_lon)
            
            chain = random.choice(hotel_chains)
            location = random.choice(locations)
            hotel_type = random.choice(hotel_types)
            
            if random.random() > 0.5:
                name = f"{chain}({city}{location})"
            else:
                name = f"{city}{chain}{hotel_type}"
            
            star = random.choice([3, 4, 5, 5])
            base_price = {3: 200, 4: 400, 5: 800}[star]
            price_min = int(base_price * random.uniform(0.8, 1.2))
            price_max = int(price_min * random.uniform(1.5, 2.5))
            
            rating = round(random.uniform(4.0, 4.9), 1)
            
            booking_links = self.generate_booking_links(
                hotel_name=name,
                city=city,
                check_in=check_in,
                check_out=check_out,
                latitude=hotel_lat,
                longitude=hotel_lon
            )
            
            hotel = Hotel(
                id=f"mock_{city}_{i+1}",
                name=name,
                address=f"{city}市{random.choice(['中心区', '商业区', '景区附近'])}{random.randint(1, 999)}号",
                city=city,
                latitude=hotel_lat,
                longitude=hotel_lon,
                rating=rating,
                star_rating=star,
                price_min=price_min,
                price_max=price_max,
                distance_km=distance,
                image_url=self._get_default_hotel_image(name),
                amenities=random.choice(amenities_pool),
                description=f"{name}位于{city}市中心地段，交通便利，设施齐全，是您商务出行和休闲旅游的理想选择。",
                phone=f"0{random.randint(10, 99)}-{random.randint(10000000, 99999999)}",
                source="mock",
                booking_links=booking_links,
                booking_url=booking_links.get("ctrip", "")
            )
            hotels.append(hotel)
        
        hotels.sort(key=lambda h: h.distance_km or 0)
        
        return hotels
    
    async def search_hotels_fliggy(
        self,
        city: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        keyword: Optional[str] = None,
        price_min: Optional[int] = None,
        price_max: Optional[int] = None,
        page_size: int = 20
    ) -> List[Hotel]:
        """
        使用飞猪API搜索酒店
        
        Args:
            city: 城市名称
            check_in: 入住日期
            check_out: 离店日期
            keyword: 搜索关键词
            price_min: 最低价格
            price_max: 最高价格
            page_size: 返回数量
        
        Returns:
            酒店列表
        """
        if not self.fliggy_client:
            return []
        
        city_info = self.JIANGNAN_CITIES.get(city)
        if not city_info:
            return []
        
        try:
            search_client = FliggyHotelSearchClient(
                self.fliggy_client.app_key,
                self.fliggy_client.app_secret
            )
            
            result = await search_client.search_hotels(
                city_id=city_info["city_id"],
                keyword=keyword,
                check_in=check_in,
                check_out=check_out,
                price_min=price_min,
                price_max=price_max,
                page_size=page_size
            )
            
            hotels = []
            hotel_list = result.get("hotels", [])
            
            for h in hotel_list:
                hotel_name = h.get("name", "")
                image_url = h.get("pic_url", "")
                if not image_url:
                    image_url = self._get_default_hotel_image(hotel_name)
                
                hotel = Hotel(
                    id=f"fliggy_{h.get('shid', h.get('id', ''))}",
                    name=hotel_name,
                    address=h.get("address", ""),
                    city=city,
                    latitude=float(h.get("latitude", 0)),
                    longitude=float(h.get("longitude", 0)),
                    rating=float(h.get("rating", 0)),
                    star_rating=int(h.get("star", 0)),
                    price_min=int(h.get("price", 0)),
                    source="fliggy",
                    sh_id=str(h.get("shid", "")),
                    image_url=image_url,
                    amenities=h.get("facilities", [])
                )
                hotels.append(hotel)
            
            return hotels
            
        except TaobaoAPIError as e:
            logger.error(f"飞猪API调用失败: {str(e)}")
            return []
    
    async def get_hotel_price(
        self,
        sh_id: str,
        check_in: str,
        check_out: str,
        user_id: Optional[int] = None
    ) -> Optional[HotelPriceInfo]:
        """
        获取酒店实时价格
        
        Args:
            sh_id: 飞猪标准酒店ID
            check_in: 入住日期
            check_out: 离店日期
            user_id: 用户ID
        
        Returns:
            价格信息
        """
        if not self.fliggy_client:
            return None
        
        try:
            result = await self.fliggy_client.hotel_compare(
                sh_id=sh_id,
                check_in=check_in,
                check_out=check_out,
                user_id=user_id,
                with_qr_code=True
            )
            
            price_data = result.get("alibaba_fliggy_cps_hotel_compare_response", {})
            if not price_data.get("is_success"):
                return None
            
            model = price_data.get("model", {})
            price_list = model.get("price_list", [])
            
            if not price_list:
                return None
            
            lowest_price = min(price_list, key=lambda x: x.get("price", float("inf")))
            
            return HotelPriceInfo(
                hotel_id=sh_id,
                check_in=check_in,
                check_out=check_out,
                room_type=lowest_price.get("room_type", "标准间"),
                price=int(lowest_price.get("price", 0)),
                price_unit="分",
                available=lowest_price.get("available", True),
                booking_url=lowest_price.get("booking_url"),
            )
            
        except TaobaoAPIError as e:
            logger.error(f"获取酒店价格失败: {str(e)}")
            return None
    
    async def get_hotel_details(
        self,
        hotel_id: str,
        activity_id: str = "sht_zb_travel",
        promotion_position_id: int = 0,
        promote_app_key: int = 0
    ) -> Optional[Dict[str, Any]]:
        """
        获取酒店详细信息
        
        使用 alibaba.fliggy.promote.hotel.details 接口
        
        Args:
            hotel_id: 酒店ID
            activity_id: 活动编码
            promotion_position_id: 推广位ID
            promote_app_key: 媒体ID
        
        Returns:
            酒店详细信息
        """
        if not self.fliggy_client:
            return None
        
        try:
            result = await self.fliggy_client.get_hotel_details(
                hotel_id=hotel_id,
                activity_id=activity_id,
                promotion_position_id=promotion_position_id,
                promote_app_key=promote_app_key
            )
            
            response = result.get("alibaba_fliggy_promote_hotel_details_response", {})
            if not response.get("is_success"):
                return None
            
            model = response.get("model", {})
            hotel_detail = model.get("hotel_detail", {})
            
            facilities = []
            for facility_group in hotel_detail.get("facilities", []):
                for facility in facility_group.get("facility_instance_list", []):
                    if facility.get("have"):
                        facilities.append(facility.get("facility_name", ""))
            
            rooms = []
            for room in hotel_detail.get("room_list", []):
                room_info = {
                    "room_id": room.get("room_id"),
                    "room_name": room.get("room_name"),
                    "area": room.get("area"),
                    "floor": room.get("floor"),
                    "has_window": room.get("has_window"),
                    "bed_details": room.get("bed_details", []),
                    "room_facilities": []
                }
                for facility in room.get("room_facilities", []):
                    if facility.get("have"):
                        room_info["room_facilities"].append(facility.get("facility_name"))
                rooms.append(room_info)
            
            return {
                "hotel_id": hotel_detail.get("hotel_id"),
                "hotel_name": hotel_detail.get("hotel_name"),
                "hotel_name_en": hotel_detail.get("hotel_name_en"),
                "address": hotel_detail.get("address"),
                "city_code": hotel_detail.get("city_code"),
                "city_name": hotel_detail.get("city_name"),
                "latitude": float(hotel_detail.get("latitude", 0)) if hotel_detail.get("latitude") else None,
                "longitude": float(hotel_detail.get("longitude", 0)) if hotel_detail.get("longitude") else None,
                "phone_list": hotel_detail.get("phone_list", []),
                "hotel_type": hotel_detail.get("hotel_type"),
                "hotel_star": hotel_detail.get("hotel_star"),
                "hotel_category": hotel_detail.get("hotel_category"),
                "brand_name": hotel_detail.get("brand_name"),
                "group_name": hotel_detail.get("group_name"),
                "hotel_desc": hotel_detail.get("hotel_desc"),
                "hotel_brief": hotel_detail.get("hotel_brief"),
                "facilities": facilities,
                "rooms": rooms,
                "arrival_time": hotel_detail.get("arrival_time"),
                "departure_time": hotel_detail.get("departure_time"),
                "support_breakfast": hotel_detail.get("support_breakfast"),
                "support_free_cancel": hotel_detail.get("support_free_cancel"),
                "support_special_invoice": hotel_detail.get("support_special_invoice"),
                "total_score": hotel_detail.get("total_score"),
                "open_year": hotel_detail.get("open_year"),
                "fitment_year": hotel_detail.get("fitment_year"),
                "floors": hotel_detail.get("floors"),
                "rooms_count": hotel_detail.get("rooms"),
                "email": hotel_detail.get("email"),
                "postal_code": hotel_detail.get("postal_code"),
                "business_zone": hotel_detail.get("business_zone"),
                "pet_info": hotel_detail.get("pet_info"),
                "children_policy": hotel_detail.get("children_policy"),
                "breakfast_policy": hotel_detail.get("breakfast_policy"),
                "park_infos": hotel_detail.get("park_infos", [])
            }
            
        except TaobaoAPIError as e:
            logger.error(f"获取酒店详情失败: {str(e)}")
            return None
    
    async def recommend_hotels_for_attraction(
        self,
        attraction_lat: float,
        attraction_lon: float,
        attraction_name: str,
        city: Optional[str] = None,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        radius_km: float = 3.0,
        limit: int = 10
    ) -> List[Hotel]:
        """
        为景点推荐附近酒店
        
        Args:
            attraction_lat: 景点纬度
            attraction_lon: 景点经度
            attraction_name: 景点名称
            city: 城市名称
            check_in: 入住日期
            check_out: 离店日期
            radius_km: 搜索半径（公里）
            limit: 返回数量
        
        Returns:
            推荐酒店列表
        """
        radius_m = int(radius_km * 1000)
        
        tasks = []
        
        if self.use_amap:
            tasks.append(self.search_hotels_amap(
                latitude=attraction_lat,
                longitude=attraction_lon,
                radius=radius_m,
                city=city
            ))
        
        if self.use_fliggy and city:
            tasks.append(self.search_hotels_fliggy(
                city=city,
                check_in=check_in,
                check_out=check_out,
                keyword=attraction_name
            ))
        
        if not tasks:
            return []
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_hotels = []
        for result in results:
            if isinstance(result, list):
                all_hotels.extend(result)
        
        seen_ids = set()
        unique_hotels = []
        for hotel in all_hotels:
            if hotel.id not in seen_ids:
                seen_ids.add(hotel.id)
                hotel.distance_km = self._calculate_distance(
                    attraction_lat, attraction_lon,
                    hotel.latitude, hotel.longitude
                )
                unique_hotels.append(hotel)
        
        unique_hotels.sort(key=lambda h: h.distance_km or float("inf"))
        
        return unique_hotels[:limit]
    
    async def recommend_hotels_for_itinerary(
        self,
        daily_attractions: List[Dict[str, Any]],
        check_in_date: Optional[str] = None,
        budget_per_night: Optional[int] = None,
        prefer_city: Optional[str] = None
    ) -> Dict[str, List[Hotel]]:
        """
        为行程推荐酒店
        
        Args:
            daily_attractions: 每日景点列表 [{"day": 1, "attractions": [...]}]
            check_in_date: 入住日期
            budget_per_night: 每晚预算
            prefer_city: 首选城市
        
        Returns:
            每日酒店推荐
        """
        recommendations = {}
        
        for day_info in daily_attractions:
            day = day_info.get("day", 1)
            attractions = day_info.get("attractions", [])
            
            if not attractions:
                continue
            
            center_lat = sum(a.get("latitude", 0) for a in attractions) / len(attractions)
            center_lon = sum(a.get("longitude", 0) for a in attractions) / len(attractions)
            
            first_attraction = attractions[0]
            city = prefer_city or first_attraction.get("city", "")
            
            check_in = check_in_date
            if check_in:
                check_dt = datetime.strptime(check_in, "%Y-%m-%d")
                check_out = (check_dt + timedelta(days=1)).strftime("%Y-%m-%d")
            else:
                check_out = None
            
            hotels = await self.recommend_hotels_for_attraction(
                attraction_lat=center_lat,
                attraction_lon=center_lon,
                attraction_name=first_attraction.get("name", ""),
                city=city,
                check_in=check_in,
                check_out=check_out,
                radius_km=5.0,
                limit=5
            )
            
            if budget_per_night:
                hotels = [h for h in hotels if h.price_min and h.price_min <= budget_per_night]
            
            recommendations[f"day_{day}"] = hotels
        
        return recommendations
    
    def generate_booking_link(
        self,
        hotel: Hotel,
        check_in: str,
        check_out: str,
        promotion_id: Optional[str] = None
    ) -> str:
        """
        生成预订链接
        
        Args:
            hotel: 酒店信息
            check_in: 入住日期
            check_out: 离店日期
            promotion_id: 推广位ID
        
        Returns:
            预订链接
        """
        if hotel.source == "fliggy" and hotel.sh_id:
            base_url = "https://hotel.fliggy.com/hotelDetail.htm"
            params = {
                "shid": hotel.sh_id,
                "checkIn": check_in,
                "checkOut": check_out
            }
            if promotion_id:
                params["promotionId"] = promotion_id
            
            query = "&".join(f"{k}={v}" for k, v in params.items())
            return f"{base_url}?{query}"
        
        return f"https://www.fliggy.com/hotel/search?keyword={hotel.name}&city={hotel.city}"
    
    async def get_hotel_product_info(
        self,
        hid: Optional[str] = None,
        outer_id: Optional[str] = None,
        shid: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        获取酒店商品信息
        
        使用 taobao.xhotel.get 接口
        
        Args:
            hid: 酒店ID
            outer_id: 外部酒店ID
            shid: 标准酒店ID
        
        Returns:
            酒店商品信息
        """
        if not self.fliggy_client:
            return None
        
        try:
            from taobao_client import FliggyHotelProductClient
            
            product_client = FliggyHotelProductClient(
                self.fliggy_client.app_key,
                self.fliggy_client.app_secret
            )
            
            result = await product_client.get_hotel(
                hid=hid,
                outer_id=outer_id,
                shid=shid
            )
            
            response = result.get("xhotel_get_response", {})
            xhotel = response.get("xhotel", {})
            
            if not xhotel:
                return None
            
            return {
                "hid": xhotel.get("hid"),
                "name": xhotel.get("name"),
                "name_en": xhotel.get("name_e"),
                "outer_id": xhotel.get("outer_id"),
                "status": xhotel.get("status"),
                "domestic": xhotel.get("domestic"),
                "country": xhotel.get("country"),
                "province": xhotel.get("province"),
                "city": xhotel.get("city"),
                "district": xhotel.get("district"),
                "address": xhotel.get("address"),
                "latitude": float(xhotel.get("latitude", 0)) if xhotel.get("latitude") else None,
                "longitude": float(xhotel.get("longitude", 0)) if xhotel.get("longitude") else None,
                "tel": xhotel.get("tel"),
                "brand": xhotel.get("brand"),
                "star": xhotel.get("star"),
                "desc": xhotel.get("desc"),
                "opening_time": xhotel.get("opening_time"),
                "decorate_time": xhotel.get("decorate_time"),
                "floors": xhotel.get("storeys"),
                "rooms": xhotel.get("rooms"),
                "service": xhotel.get("service"),
                "hotel_facilities": xhotel.get("hotel_facilities"),
                "room_facilities": xhotel.get("room_facilities"),
                "shid": xhotel.get("s_hotel", {}).get("shid") if xhotel.get("s_hotel") else None
            }
            
        except TaobaoAPIError as e:
            logger.error(f"获取酒店商品信息失败: {str(e)}")
            return None
    
    async def get_hotel_room_types(
        self,
        hid: Optional[str] = None,
        outer_id: Optional[str] = None
    ) -> Optional[List[Dict[str, Any]]]:
        """
        获取酒店房型列表
        
        使用 taobao.xhotel.roomtype.get 接口
        
        Args:
            hid: 酒店ID
            outer_id: 外部ID
        
        Returns:
            房型列表
        """
        if not self.fliggy_client:
            return None
        
        try:
            from taobao_client import FliggyHotelProductClient
            
            product_client = FliggyHotelProductClient(
                self.fliggy_client.app_key,
                self.fliggy_client.app_secret
            )
            
            result = await product_client.get_roomtype(
                hid=hid,
                outer_id=outer_id
            )
            
            response = result.get("xhotel_roomtype_get_response", {})
            roomtypes = response.get("roomtypes", {}).get("roomtype", [])
            
            if not roomtypes:
                return []
            
            rooms = []
            for room in roomtypes:
                rooms.append({
                    "rid": room.get("rid"),
                    "name": room.get("name"),
                    "outer_id": room.get("outer_id"),
                    "status": room.get("status"),
                    "area": room.get("area"),
                    "floor": room.get("floor"),
                    "bed_type": room.get("bed_type"),
                    "has_window": room.get("has_window"),
                    "max_occupancy": room.get("max_occupancy"),
                    "facilities": room.get("room_facilities"),
                    "desc": room.get("desc")
                })
            
            return rooms
            
        except TaobaoAPIError as e:
            logger.error(f"获取酒店房型失败: {str(e)}")
            return None
    
    async def get_hotel_rate_plans(
        self,
        hid: Optional[str] = None,
        outer_id: Optional[str] = None
    ) -> Optional[List[Dict[str, Any]]]:
        """
        获取酒店价格计划
        
        使用 taobao.xhotel.rateplan.get 接口
        
        Args:
            hid: 酒店ID
            outer_id: 外部ID
        
        Returns:
            价格计划列表
        """
        if not self.fliggy_client:
            return None
        
        try:
            from taobao_client import FliggyHotelProductClient
            
            product_client = FliggyHotelProductClient(
                self.fliggy_client.app_key,
                self.fliggy_client.app_secret
            )
            
            result = await product_client.get_rateplan(
                hid=hid,
                outer_id=outer_id
            )
            
            response = result.get("xhotel_rateplan_get_response", {})
            rateplans = response.get("rateplans", {}).get("rateplan", [])
            
            if not rateplans:
                return []
            
            plans = []
            for plan in rateplans:
                plans.append({
                    "rpid": plan.get("rpid"),
                    "name": plan.get("name"),
                    "outer_id": plan.get("outer_id"),
                    "status": plan.get("status"),
                    "payment_type": plan.get("payment_type"),
                    "breakfast_type": plan.get("breakfast_type"),
                    "cancel_policy": plan.get("cancel_policy"),
                    "confirm_type": plan.get("confirm_type"),
                    "desc": plan.get("desc")
                })
            
            return plans
            
        except TaobaoAPIError as e:
            logger.error(f"获取价格计划失败: {str(e)}")
            return None
    
    async def get_hotel_room_with_price(
        self,
        hid: Optional[str] = None,
        shid: Optional[str] = None,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        获取酒店房型与房价
        
        使用 taobao.xhotel.baseinfo.room.get 接口
        
        Args:
            hid: 酒店ID
            shid: 标准酒店ID
            check_in: 入住日期
            check_out: 离店日期
        
        Returns:
            酒店房型与房价信息
        """
        if not self.fliggy_client:
            return None
        
        try:
            from taobao_client import FliggyHotelProductClient
            
            product_client = FliggyHotelProductClient(
                self.fliggy_client.app_key,
                self.fliggy_client.app_secret
            )
            
            result = await product_client.get_baseinfo_room(
                hid=hid,
                shid=shid,
                check_in=check_in,
                check_out=check_out
            )
            
            response = result.get("xhotel_baseinfo_room_get_response", {})
            
            if not response:
                return None
            
            return {
                "hotel_info": response.get("hotel_info", {}),
                "room_types": response.get("room_types", []),
                "rate_plans": response.get("rate_plans", []),
                "prices": response.get("prices", [])
            }
            
        except TaobaoAPIError as e:
            logger.error(f"获取酒店房型房价失败: {str(e)}")
            return None
