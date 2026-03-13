"""
行程分享相关API路由
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.services.share_service import share_service
from database import get_db
from sqlalchemy.orm import Session
from auth_utils import get_current_user
from models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/share")


class CreateShareRequest(BaseModel):
    itinerary_id: int
    expire_days: int = 30


@router.post("/create")
async def create_share(
    request: CreateShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = share_service.create_share(
            db=db,
            itinerary_id=request.itinerary_id,
            user_id=current_user.id,
            expire_days=request.expire_days
        )
        if not result:
            raise HTTPException(status_code=400, detail="创建分享失败，行程不存在或无权限")
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建分享失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{share_code}")
async def get_shared_itinerary(
    share_code: str,
    db: Session = Depends(get_db)
):
    try:
        result = share_service.get_shared_itinerary(share_code, db)
        if not result:
            raise HTTPException(status_code=404, detail="分享不存在或已过期")
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取分享行程失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{share_code}/like")
async def like_shared_itinerary(share_code: str):
    try:
        success = share_service.like_shared_itinerary(share_code)
        if not success:
            raise HTTPException(status_code=404, detail="分享不存在")
        return {"success": True, "message": "点赞成功"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"点赞失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/popular")
async def get_popular_shares(limit: int = Query(10, ge=1, le=50)):
    try:
        result = share_service.get_popular_shares(limit)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"获取热门分享失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my/shares")
async def get_my_shares(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = share_service.get_user_shares(current_user.id)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"获取我的分享失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
