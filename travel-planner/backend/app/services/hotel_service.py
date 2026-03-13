"""
酒店预订服务模块
对接第三方OTA平台，提供酒店搜索和预订功能
"""
import httpx
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, date, timedelta
from dataclasses import dataclass
from app.core.config import settings
from app.core.cache import cached

logger = logging.getLogger(__name__)


@dataclass
class HotelInfo:
    hotel_id: str
    name: str
    city: str
    address: str
    rating: float
    star_rating: int
    price: float
    original_price: float
    discount: float
    image: str
    amenities: List[str]
    description: str
    distance_center: float
    score: float
    review_count: int
    provider: str


@dataclass
class RoomInfo:
    room_id: str
    hotel_id: str
    room_type: str
    bed_type: str
    price: float
    original_price: float
    stock: int
    area: float
    floor: str
    window: bool
    breakfast: bool
    wifi: bool
    cancel_policy: str


@dataclass
class HotelOrder:
    order_id: str
    hotel_name: str
    room_type: str
    check_in_date: str
    check_out_date: str
    nights: int
    total_price: float
    status: str
    create_time: str
    contact_name: str
    contact_phone: str


class HotelService:
    def __init__(self):
        self.providers = {
            "ctrip": {
                "name": "携程",
                "base_url": "https://api.ctrip.com/hotel",
            },
            "qunar": {
                "name": "去哪儿",
                "base_url": "https://api.qunar.com/hotel",
            },
            "meituan": {
                "name": "美团",
                "base_url": "https://api.meituan.com/hotel",
            }
        }
        self.timeout = 10.0
    
    @cached(prefix="hotel_search", ttl=1800)
    async def search_hotels(
        self,
        city: str,
        check_in: str,
        check_out: str,
        guests: int = 1,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None,
        star_rating: Optional[int] = None
    ) -> List[HotelInfo]:
        mock_hotels = self._get_mock_hotels(city)
        
        if price_min is not None:
            mock_hotels = [h for h in mock_hotels if h.price >= price_min]
        if price_max is not None:
            mock_hotels = [h for h in mock_hotels if h.price <= price_max]
        if star_rating is not None:
            mock_hotels = [h for h in mock_hotels if h.star_rating >= star_rating]
        
        return mock_hotels
    
    async def get_hotel_detail(self, hotel_id: str) -> Optional[HotelInfo]:
        mock_hotels = self._get_all_mock_hotels()
        for hotel in mock_hotels:
            if hotel.hotel_id == hotel_id:
                return hotel
        return None
    
    async def get_room_list(
        self,
        hotel_id: str,
        check_in: str,
        check_out: str
    ) -> List[RoomInfo]:
        mock_rooms = {
            "hz_001": [
                RoomInfo(
                    room_id="hz_001_r1",
                    hotel_id="hz_001",
                    room_type="标准大床房",
                    bed_type="大床1.8米",
                    price=299.0,
                    original_price=399.0,
                    stock=10,
                    area=25.0,
                    floor="5-10层",
                    window=True,
                    breakfast=True,
                    wifi=True,
                    cancel_policy="提前1天免费取消"
                ),
                RoomInfo(
                    room_id="hz_001_r2",
                    hotel_id="hz_001",
                    room_type="豪华双床房",
                    bed_type="双床1.2米",
                    price=359.0,
                    original_price=459.0,
                    stock=5,
                    area=30.0,
                    floor="11-15层",
                    window=True,
                    breakfast=True,
                    wifi=True,
                    cancel_policy="提前1天免费取消"
                )
            ],
            "sh_001": [
                RoomInfo(
                    room_id="sh_001_r1",
                    hotel_id="sh_001",
                    room_type="商务大床房",
                    bed_type="大床2.0米",
                    price=599.0,
                    original_price=799.0,
                    stock=8,
                    area=35.0,
                    floor="10-20层",
                    window=True,
                    breakfast=True,
                    wifi=True,
                    cancel_policy="当天18点前免费取消"
                )
            ]
        }
        return mock_rooms.get(hotel_id, [])
    
    async def create_order(
        self,
        hotel_id: str,
        room_id: str,
        check_in: str,
        check_out: str,
        contact_name: str,
        contact_phone: str,
        special_request: Optional[str] = None
    ) -> Optional[HotelOrder]:
        hotel = await self.get_hotel_detail(hotel_id)
        if not hotel:
            return None
        
        rooms = await self.get_room_list(hotel_id, check_in, check_out)
        room = next((r for r in rooms if r.room_id == room_id), None)
        if not room:
            return None
        
        check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
        check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
        nights = (check_out_date - check_in_date).days
        
        order_id = f"HT{datetime.now().strftime('%Y%m%d%H%M%S')}{hash(contact_phone) % 10000:04d}"
        
        return HotelOrder(
            order_id=order_id,
            hotel_name=hotel.name,
            room_type=room.room_type,
            check_in_date=check_in,
            check_out_date=check_out,
            nights=nights,
            total_price=room.price * nights,
            status="pending_payment",
            create_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            contact_name=contact_name,
            contact_phone=contact_phone
        )
    
    async def get_order_status(self, order_id: str) -> Optional[Dict[str, Any]]:
        return {
            "order_id": order_id,
            "status": "confirmed",
            "status_text": "已确认"
        }
    
    async def cancel_order(self, order_id: str) -> bool:
        logger.info(f"取消酒店订单: {order_id}")
        return True
    
    def _get_mock_hotels(self, city: str) -> List[HotelInfo]:
        all_hotels = self._get_all_mock_hotels()
        return [h for h in all_hotels if city in h.city or h.city in city]
    
    def _get_all_mock_hotels(self) -> List[HotelInfo]:
        return [
            HotelInfo(
                hotel_id="hz_001",
                name="杭州西湖国宾馆",
                city="杭州",
                address="西湖区杨公堤18号",
                rating=4.9,
                star_rating=5,
                price=1200.0,
                original_price=1500.0,
                discount=0.8,
                image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
                amenities=["免费WiFi", "游泳池", "健身房", "停车场", "餐厅"],
                description="西湖边五星级园林式酒店，环境优美",
                distance_center=2.5,
                score=4.9,
                review_count=2580,
                provider="携程"
            ),
            HotelInfo(
                hotel_id="hz_002",
                name="杭州黄龙饭店",
                city="杭州",
                address="西湖区曙光路120号",
                rating=4.7,
                star_rating=5,
                price=800.0,
                original_price=1000.0,
                discount=0.8,
                image="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400",
                amenities=["免费WiFi", "健身房", "停车场", "餐厅", "商务中心"],
                description="市中心五星级酒店，交通便利",
                distance_center=1.0,
                score=4.7,
                review_count=3200,
                provider="美团"
            ),
            HotelInfo(
                hotel_id="sh_001",
                name="上海外滩华尔道夫酒店",
                city="上海",
                address="黄浦区中山东一路2号",
                rating=4.9,
                star_rating=5,
                price=2500.0,
                original_price=3000.0,
                discount=0.83,
                image="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400",
                amenities=["免费WiFi", "游泳池", "健身房", "SPA", "餐厅"],
                description="外滩历史建筑，奢华体验",
                distance_center=0.5,
                score=4.9,
                review_count=1850,
                provider="携程"
            ),
            HotelInfo(
                hotel_id="sz_001",
                name="苏州书香府邸平江府",
                city="苏州",
                address="姑苏区平江路",
                rating=4.8,
                star_rating=4,
                price=600.0,
                original_price=800.0,
                discount=0.75,
                image="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
                amenities=["免费WiFi", "停车场", "餐厅", "茶室"],
                description="园林式精品酒店，江南韵味",
                distance_center=0.3,
                score=4.8,
                review_count=1560,
                provider="美团"
            ),
            HotelInfo(
                hotel_id="nj_001",
                name="南京金陵饭店",
                city="南京",
                address="鼓楼区汉中路2号",
                rating=4.6,
                star_rating=5,
                price=600.0,
                original_price=750.0,
                discount=0.8,
                image="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400",
                amenities=["免费WiFi", "健身房", "停车场", "餐厅", "会议室"],
                description="南京地标酒店，交通便利",
                distance_center=1.5,
                score=4.6,
                review_count=2800,
                provider="携程"
            )
        ]


hotel_service = HotelService()
