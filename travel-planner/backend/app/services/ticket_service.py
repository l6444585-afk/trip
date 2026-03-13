"""
门票预订服务模块
对接第三方OTA平台，提供景点门票查询和预订功能
"""
import httpx
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, date
from dataclasses import dataclass
from app.core.config import settings
from app.core.cache import cached

logger = logging.getLogger(__name__)


@dataclass
class TicketInfo:
    attraction_id: str
    attraction_name: str
    ticket_type: str
    price: float
    original_price: float
    discount: float
    stock: int
    description: str
    valid_days: int
    booking_notice: str
    refund_policy: str
    provider: str
    provider_url: str


@dataclass
class TicketOrder:
    order_id: str
    attraction_name: str
    ticket_type: str
    quantity: int
    total_price: float
    visit_date: str
    status: str
    create_time: str
    qr_code: Optional[str]


class TicketService:
    def __init__(self):
        self.providers = {
            "ctrip": {
                "name": "携程",
                "base_url": "https://api.ctrip.com/ticket",
                "api_key": settings.GLM_API_KEY
            },
            "qunar": {
                "name": "去哪儿",
                "base_url": "https://api.qunar.com/ticket",
                "api_key": settings.GLM_API_KEY
            },
            "meituan": {
                "name": "美团",
                "base_url": "https://api.meituan.com/ticket",
                "api_key": settings.GLM_API_KEY
            }
        }
        self.timeout = 10.0
    
    @cached(prefix="ticket_search", ttl=3600)
    async def search_tickets(
        self, 
        attraction_name: str, 
        visit_date: Optional[str] = None
    ) -> List[TicketInfo]:
        mock_tickets = self._get_mock_tickets(attraction_name)
        return mock_tickets
    
    async def get_ticket_detail(self, ticket_id: str) -> Optional[TicketInfo]:
        mock_tickets = {
            "hz_xh_001": TicketInfo(
                attraction_id="hz_xh",
                attraction_name="杭州西湖",
                ticket_type="游船票",
                price=55.0,
                original_price=70.0,
                discount=0.79,
                stock=1000,
                description="西湖游船，含三潭印月",
                valid_days=1,
                booking_notice="需提前1天预订",
                refund_policy="未使用可全额退款",
                provider="携程",
                provider_url="https://you.ctrip.com/sight/hangzhou14/135.html"
            ),
            "sz_zy_001": TicketInfo(
                attraction_id="sz_zy",
                attraction_name="苏州拙政园",
                ticket_type="成人票",
                price=70.0,
                original_price=80.0,
                discount=0.88,
                stock=500,
                description="拙政园门票，含讲解",
                valid_days=1,
                booking_notice="当天可订",
                refund_policy="未使用可退",
                provider="美团",
                provider_url="https://www.meituan.com/zhoubianyou/"
            )
        }
        return mock_tickets.get(ticket_id)
    
    async def create_order(
        self,
        ticket_id: str,
        quantity: int,
        visit_date: str,
        contact_name: str,
        contact_phone: str
    ) -> Optional[TicketOrder]:
        ticket = await self.get_ticket_detail(ticket_id)
        if not ticket:
            return None
        
        order_id = f"TK{datetime.now().strftime('%Y%m%d%H%M%S')}{hash(contact_phone) % 10000:04d}"
        
        return TicketOrder(
            order_id=order_id,
            attraction_name=ticket.attraction_name,
            ticket_type=ticket.ticket_type,
            quantity=quantity,
            total_price=ticket.price * quantity,
            visit_date=visit_date,
            status="pending_payment",
            create_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            qr_code=f"https://qr.example.com/{order_id}"
        )
    
    async def get_order_status(self, order_id: str) -> Optional[Dict[str, Any]]:
        return {
            "order_id": order_id,
            "status": "paid",
            "status_text": "已支付",
            "qr_code": f"https://qr.example.com/{order_id}"
        }
    
    async def cancel_order(self, order_id: str) -> bool:
        logger.info(f"取消订单: {order_id}")
        return True
    
    def _get_mock_tickets(self, attraction_name: str) -> List[TicketInfo]:
        mock_data = {
            "杭州西湖": [
                TicketInfo(
                    attraction_id="hz_xh",
                    attraction_name="杭州西湖",
                    ticket_type="游船票",
                    price=55.0,
                    original_price=70.0,
                    discount=0.79,
                    stock=1000,
                    description="西湖游船，含三潭印月",
                    valid_days=1,
                    booking_notice="需提前1天预订",
                    refund_policy="未使用可全额退款",
                    provider="携程",
                    provider_url="https://you.ctrip.com/sight/hangzhou14/135.html"
                ),
                TicketInfo(
                    attraction_id="hz_xh",
                    attraction_name="杭州西湖",
                    ticket_type="雷峰塔门票",
                    price=40.0,
                    original_price=40.0,
                    discount=1.0,
                    stock=800,
                    description="雷峰塔景区门票",
                    valid_days=1,
                    booking_notice="当天可订",
                    refund_policy="未使用可退",
                    provider="美团",
                    provider_url="https://www.meituan.com/zhoubianyou/"
                )
            ],
            "苏州拙政园": [
                TicketInfo(
                    attraction_id="sz_zy",
                    attraction_name="苏州拙政园",
                    ticket_type="成人票",
                    price=70.0,
                    original_price=80.0,
                    discount=0.88,
                    stock=500,
                    description="拙政园门票",
                    valid_days=1,
                    booking_notice="当天可订",
                    refund_policy="未使用可退",
                    provider="美团",
                    provider_url="https://www.meituan.com/zhoubianyou/"
                )
            ],
            "上海外滩": [
                TicketInfo(
                    attraction_id="sh_wt",
                    attraction_name="上海外滩",
                    ticket_type="观光隧道",
                    price=50.0,
                    original_price=50.0,
                    discount=1.0,
                    stock=2000,
                    description="外滩观光隧道单程票",
                    valid_days=1,
                    booking_notice="当天可订",
                    refund_policy="未使用可退",
                    provider="携程",
                    provider_url="https://you.ctrip.com/"
                )
            ]
        }
        
        for key in mock_data:
            if key in attraction_name or attraction_name in key:
                return mock_data[key]
        
        return [
            TicketInfo(
                attraction_id="default",
                attraction_name=attraction_name,
                ticket_type="成人票",
                price=60.0,
                original_price=60.0,
                discount=1.0,
                stock=100,
                description=f"{attraction_name}门票",
                valid_days=1,
                booking_notice="当天可订",
                refund_policy="未使用可退",
                provider="携程",
                provider_url="https://you.ctrip.com/"
            )
        ]


ticket_service = TicketService()
