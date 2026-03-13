"""
门票预订相关API路由
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from app.services.ticket_service import ticket_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tickets")


class TicketOrderRequest(BaseModel):
    ticket_id: str
    quantity: int
    visit_date: str
    contact_name: str
    contact_phone: str


@router.get("/search")
async def search_tickets(
    attraction: str = Query(..., description="景点名称"),
    visit_date: Optional[str] = Query(None, description="游览日期")
):
    try:
        tickets = await ticket_service.search_tickets(attraction, visit_date)
        return {
            "success": True,
            "data": tickets,
            "total": len(tickets)
        }
    except Exception as e:
        logger.error(f"搜索门票失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticket_id}")
async def get_ticket_detail(ticket_id: str):
    try:
        ticket = await ticket_service.get_ticket_detail(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="门票不存在")
        return {"success": True, "data": ticket}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取门票详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/order")
async def create_ticket_order(order: TicketOrderRequest):
    try:
        result = await ticket_service.create_order(
            ticket_id=order.ticket_id,
            quantity=order.quantity,
            visit_date=order.visit_date,
            contact_name=order.contact_name,
            contact_phone=order.contact_phone
        )
        if not result:
            raise HTTPException(status_code=400, detail="创建订单失败")
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建门票订单失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order/{order_id}")
async def get_order_status(order_id: str):
    try:
        result = await ticket_service.get_order_status(order_id)
        if not result:
            raise HTTPException(status_code=404, detail="订单不存在")
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取订单状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/order/{order_id}/cancel")
async def cancel_ticket_order(order_id: str):
    try:
        success = await ticket_service.cancel_order(order_id)
        if not success:
            raise HTTPException(status_code=400, detail="取消订单失败")
        return {"success": True, "message": "订单已取消"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"取消订单失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
