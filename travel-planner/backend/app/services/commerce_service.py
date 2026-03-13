"""
商业化服务模块
支持订单管理、支付集成、佣金结算等商业化能力
"""
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import uuid
import hashlib

logger = logging.getLogger(__name__)


class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class OrderType(str, Enum):
    TICKET = "ticket"
    HOTEL = "hotel"
    PACKAGE = "package"
    CUSTOM = "custom"


@dataclass
class Order:
    order_id: str
    user_id: int
    order_type: OrderType
    items: List[Dict]
    total_amount: float
    discount_amount: float
    final_amount: float
    status: OrderStatus
    payment_method: str
    payment_time: Optional[datetime]
    create_time: datetime
    update_time: datetime
    contact_name: str
    contact_phone: str
    remark: str


@dataclass
class PaymentRecord:
    payment_id: str
    order_id: str
    amount: float
    method: str
    status: str
    transaction_id: str
    create_time: datetime


class CommerceService:
    def __init__(self):
        self.orders: Dict[str, Order] = {}
        self.payments: Dict[str, PaymentRecord] = {}
        self.commission_rates = {
            "ticket": 0.05,
            "hotel": 0.08,
            "package": 0.10,
            "custom": 0.12
        }
    
    def create_order(
        self,
        user_id: int,
        order_type: OrderType,
        items: List[Dict],
        contact_name: str,
        contact_phone: str,
        remark: str = "",
        coupon_code: str = None
    ) -> Optional[Order]:
        order_id = self._generate_order_id(order_type)
        
        total_amount = sum(item.get("price", 0) * item.get("quantity", 1) for item in items)
        
        discount_amount = 0.0
        if coupon_code:
            discount_amount = self._apply_coupon(coupon_code, total_amount)
        
        final_amount = total_amount - discount_amount
        
        order = Order(
            order_id=order_id,
            user_id=user_id,
            order_type=order_type,
            items=items,
            total_amount=total_amount,
            discount_amount=discount_amount,
            final_amount=final_amount,
            status=OrderStatus.PENDING,
            payment_method="",
            payment_time=None,
            create_time=datetime.now(),
            update_time=datetime.now(),
            contact_name=contact_name,
            contact_phone=contact_phone,
            remark=remark
        )
        
        self.orders[order_id] = order
        logger.info(f"创建订单: {order_id}, 用户: {user_id}, 金额: {final_amount}")
        
        return order
    
    def _generate_order_id(self, order_type: OrderType) -> str:
        prefix = {
            OrderType.TICKET: "TK",
            OrderType.HOTEL: "HT",
            OrderType.PACKAGE: "PK",
            OrderType.CUSTOM: "CT"
        }.get(order_type, "OD")
        
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_str = uuid.uuid4().hex[:6].upper()
        
        return f"{prefix}{timestamp}{random_str}"
    
    def _apply_coupon(self, coupon_code: str, amount: float) -> float:
        coupons = {
            "NEWUSER": min(50, amount * 0.1),
            "VIP10": amount * 0.1,
            "VIP20": amount * 0.2,
            "SUMMER": 30
        }
        
        return coupons.get(coupon_code.upper(), 0)
    
    def get_order(self, order_id: str) -> Optional[Order]:
        return self.orders.get(order_id)
    
    def get_user_orders(
        self,
        user_id: int,
        status: OrderStatus = None,
        limit: int = 20
    ) -> List[Order]:
        orders = [
            order for order in self.orders.values()
            if order.user_id == user_id
        ]
        
        if status:
            orders = [o for o in orders if o.status == status]
        
        orders.sort(key=lambda x: x.create_time, reverse=True)
        return orders[:limit]
    
    def process_payment(
        self,
        order_id: str,
        payment_method: str,
        amount: float
    ) -> Optional[PaymentRecord]:
        order = self.get_order(order_id)
        if not order:
            return None
        
        if order.status != OrderStatus.PENDING:
            return None
        
        payment_id = f"PAY{uuid.uuid4().hex[:12].upper()}"
        transaction_id = f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        payment = PaymentRecord(
            payment_id=payment_id,
            order_id=order_id,
            amount=amount,
            method=payment_method,
            status="success",
            transaction_id=transaction_id,
            create_time=datetime.now()
        )
        
        self.payments[payment_id] = payment
        
        order.status = OrderStatus.PAID
        order.payment_method = payment_method
        order.payment_time = datetime.now()
        order.update_time = datetime.now()
        
        logger.info(f"支付成功: {order_id}, 支付方式: {payment_method}, 金额: {amount}")
        
        return payment
    
    def cancel_order(self, order_id: str, reason: str = "") -> bool:
        order = self.get_order(order_id)
        if not order:
            return False
        
        if order.status not in [OrderStatus.PENDING, OrderStatus.PAID]:
            return False
        
        order.status = OrderStatus.CANCELLED
        order.update_time = datetime.now()
        
        logger.info(f"订单取消: {order_id}, 原因: {reason}")
        
        return True
    
    def refund_order(self, order_id: str, reason: str = "") -> bool:
        order = self.get_order(order_id)
        if not order:
            return False
        
        if order.status != OrderStatus.PAID:
            return False
        
        order.status = OrderStatus.REFUNDED
        order.update_time = datetime.now()
        
        logger.info(f"订单退款: {order_id}, 原因: {reason}")
        
        return True
    
    def calculate_commission(self, order_id: str) -> float:
        order = self.get_order(order_id)
        if not order:
            return 0.0
        
        rate = self.commission_rates.get(order.order_type, 0.05)
        return order.final_amount * rate
    
    def get_order_statistics(self, user_id: int = None) -> Dict[str, Any]:
        orders = list(self.orders.values())
        
        if user_id:
            orders = [o for o in orders if o.user_id == user_id]
        
        total_orders = len(orders)
        total_amount = sum(o.final_amount for o in orders if o.status == OrderStatus.COMPLETED)
        
        status_counts = {}
        for status in OrderStatus:
            status_counts[status.value] = len([o for o in orders if o.status == status])
        
        return {
            "total_orders": total_orders,
            "total_amount": total_amount,
            "status_counts": status_counts,
            "average_order_value": total_amount / total_orders if total_orders > 0 else 0
        }


commerce_service = CommerceService()


def get_commerce_service() -> CommerceService:
    return commerce_service
