"""
酒店预订相关API路由
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from app.services.hotel_service import hotel_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/hotels")


class HotelOrderRequest(BaseModel):
    hotel_id: str
    room_id: str
    check_in: str
    check_out: str
    contact_name: str
    contact_phone: str
    special_request: Optional[str] = None


@router.get("/search")
async def search_hotels(
    city: str = Query(..., description="城市名称"),
    check_in: str = Query(..., description="入住日期"),
    check_out: str = Query(..., description="离店日期"),
    guests: int = Query(1, ge=1, le=10, description="入住人数"),
    price_min: Optional[float] = Query(None, ge=0, description="最低价格"),
    price_max: Optional[float] = Query(None, ge=0, description="最高价格"),
    star_rating: Optional[int] = Query(None, ge=1, le=5, description="酒店星级")
):
    try:
        hotels = await hotel_service.search_hotels(
            city=city,
            check_in=check_in,
            check_out=check_out,
            guests=guests,
            price_min=price_min,
            price_max=price_max,
            star_rating=star_rating
        )
        return {
            "success": True,
            "data": hotels,
            "total": len(hotels),
            "search_params": {
                "city": city,
                "check_in": check_in,
                "check_out": check_out,
                "guests": guests
            }
        }
    except Exception as e:
        logger.error(f"搜索酒店失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{hotel_id}")
async def get_hotel_detail(hotel_id: str):
    try:
        hotel = await hotel_service.get_hotel_detail(hotel_id)
        if not hotel:
            raise HTTPException(status_code=404, detail="酒店不存在")
        return {"success": True, "data": hotel}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取酒店详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{hotel_id}/rooms")
async def get_hotel_rooms(
    hotel_id: str,
    check_in: str = Query(..., description="入住日期"),
    check_out: str = Query(..., description="离店日期")
):
    try:
        rooms = await hotel_service.get_room_list(hotel_id, check_in, check_out)
        return {
            "success": True,
            "data": rooms,
            "total": len(rooms)
        }
    except Exception as e:
        logger.error(f"获取房型列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/order")
async def create_hotel_order(order: HotelOrderRequest):
    try:
        result = await hotel_service.create_order(
            hotel_id=order.hotel_id,
            room_id=order.room_id,
            check_in=order.check_in,
            check_out=order.check_out,
            contact_name=order.contact_name,
            contact_phone=order.contact_phone,
            special_request=order.special_request
        )
        if not result:
            raise HTTPException(status_code=400, detail="创建订单失败")
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建酒店订单失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order/{order_id}")
async def get_order_status(order_id: str):
    try:
        result = await hotel_service.get_order_status(order_id)
        if not result:
            raise HTTPException(status_code=404, detail="订单不存在")
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取订单状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/order/{order_id}/cancel")
async def cancel_hotel_order(order_id: str):
    try:
        success = await hotel_service.cancel_order(order_id)
        if not success:
            raise HTTPException(status_code=400, detail="取消订单失败")
        return {"success": True, "message": "订单已取消"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"取消订单失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
