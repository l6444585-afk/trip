"""
门票相关API路由
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.ticket_service import ticket_service, TicketStatus, OrderStatus
from app.core.cache import redis_client
from app.core.security import get_current_user

router = APIRouter()


class CreateOrderRequest(BaseModel):
    """创建订单请求"""
    ticket_id: str = Field(..., description="票种ID")
    quantity: int = Field(..., ge=1, description="购买数量")
    visit_date: str = Field(..., description="游玩日期(YYYY-MM-DD)")
    visit_time_slot: Optional[str] = Field(None, description="游玩时段")
    contact_name: str = Field(..., description="联系人姓名")
    contact_phone: str = Field(..., description="联系电话")
    id_numbers: Optional[List[str]] = Field(None, description="身份证号列表")


class PayOrderRequest(BaseModel):
    """支付订单请求"""
    order_id: str = Field(..., description="订单ID")
    payment_method: str = Field("alipay", description="支付方式(alipay/wechat)")


class OrderResponse(BaseModel):
    """订单响应"""
    order_id: str
    user_id: str
    ticket_id: str
    ticket_name: str
    quantity: int
    total_price: float
    visit_date: str
    visit_time_slot: Optional[str]
    status: str
    create_time: str
    pay_time: Optional[str]
    use_time: Optional[str]
    qr_code: Optional[str]
    contact_name: str
    contact_phone: str
    id_numbers: List[str]


@router.get("/available", response_model=dict)
async def get_available_tickets(
    attraction_id: str = Query(..., description="景点ID"),
    visit_date: str = Query(..., description="游玩日期(YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量")
):
    """获取可用票种"""
    try:
        result = await ticket_service.get_available_tickets(
            attraction_id=attraction_id,
            visit_date=visit_date,
            page=page,
            page_size=page_size
        )

        return {
            "code": 200,
            "message": "success",
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders", response_model=dict)
async def create_order(
    request: CreateOrderRequest,
    # user: dict = Depends(get_current_user)  # 需要用户认证时启用
):
    """创建门票订单"""
    try:
        # 模拟用户ID，实际应该从认证获取
        user_id = "demo_user_001"

        result = await ticket_service.create_order(
            user_id=user_id,
            ticket_id=request.ticket_id,
            quantity=request.quantity,
            visit_date=request.visit_date,
            visit_time_slot=request.visit_time_slot,
            contact_name=request.contact_name,
            contact_phone=request.contact_phone,
            id_numbers=request.id_numbers or []
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])

        return {
            "code": 200,
            "message": "订单创建成功",
            "data": result["data"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}", response_model=dict)
async def get_order(
    order_id: str,
    # user: dict = Depends(get_current_user)  # 需要用户认证时启用
):
    """获取订单详情"""
    try:
        order = await ticket_service._get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")

        return {
            "code": 200,
            "message": "success",
            "data": order.__dict__
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/{order_id}/pay", response_model=dict)
async def pay_order(
    order_id: str,
    request: PayOrderRequest,
    # user: dict = Depends(get_current_user)  # 需要用户认证时启用
):
    """支付订单"""
    try:
        result = await ticket_service.pay_order(
            order_id=order_id,
            payment_method=request.payment_method
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])

        return {
            "code": 200,
            "message": "支付成功",
            "data": result["data"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/{order_id}/cancel", response_model=dict)
async def cancel_order(
    order_id: str,
    # user: dict = Depends(get_current_user)  # 需要用户认证时启用
):
    """取消订单"""
    try:
        result = await ticket_service.cancel_order(order_id)

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])

        return {
            "code": 200,
            "message": "订单已取消",
            "data": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify", response_model=dict)
async def verify_ticket(qr_code: str):
    """核销门票"""
    try:
        result = await ticket_service.verify_ticket(qr_code)

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])

        return {
            "code": 200,
            "message": "核销成功",
            "data": result["data"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders", response_model=dict)
async def list_orders(
    user_id: str = Query(..., description="用户ID"),
    status: Optional[str] = Query(None, description="订单状态"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量")
):
    """获取用户订单列表"""
    try:
        # 模拟实现，实际应该从数据库查询
        orders = []
        pattern = f"order:*"
        keys = await redis_client.keys(pattern)

        for key in keys[:page_size]:  # 简单分页
            data = await redis_client.get(key)
            if data:
                order_dict = json.loads(data)
                if not status or order_dict.get("status") == status:
                    orders.append(order_dict)

        return {
            "code": 200,
            "message": "success",
            "data": {
                "orders": orders,
                "total": len(orders),
                "page": page,
                "page_size": page_size
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{attraction_id}", response_model=dict)
async def get_ticket_stats(
    attraction_id: str,
    date: str = Query(..., description="日期(YYYY-MM-DD)")
):
    """获取票务统计"""
    try:
        # 获取各票种库存和销量
        tickets = await ticket_service._get_tickets_by_attraction(attraction_id)

        stats = []
        for ticket in tickets:
            stock = await ticket_service._get_stock(ticket.ticket_id, date)
            sold = await ticket_service._get_sold(ticket.ticket_id, date)

            stats.append({
                "ticket_id": ticket.ticket_id,
                "ticket_name": ticket.ticket_name,
                "price": ticket.price,
                "stock": stock,
                "sold": sold,
                "availability": "有票" if stock > 0 else "无票"
            })

        return {
            "code": 200,
            "message": "success",
            "data": {
                "attraction_id": attraction_id,
                "date": date,
                "stats": stats
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-timeout")
async def check_payment_timeout():
    """检查支付超时订单"""
    try:
        await ticket_service.check_payment_timeout()
        return {
            "code": 200,
            "message": "检查完成",
            "data": {"processed": True}
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))