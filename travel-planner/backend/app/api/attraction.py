"""
景点相关API路由
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from pydantic import BaseModel

from app.services.attraction_service import attraction_service
from app.core.cache import redis_client
from app.core.circuit_breaker import circuit_breaker
from app.core.rate_limiter import RateLimiter

router = APIRouter()
rate_limiter = RateLimiter(max_calls=100, period=1.0)


class SearchParams(BaseModel):
    """搜索参数"""
    keyword: str
    city: Optional[str] = None
    attraction_type: Optional[str] = None
    radius: int = 5000
    page: int = 1
    page_size: int = 20
    sort_by: str = "distance"
    longitude: Optional[float] = None
    latitude: Optional[float] = None


class AttractionDetailResponse(BaseModel):
    """景点详情响应"""
    id: str
    name: str
    type: str
    address: str
    province: str
    city: str
    district: str
    longitude: float
    latitude: float
    tel: Optional[str]
    website: Optional[str]
    rating: float
    review_count: int
    business_hours: Optional[str]
    price: Optional[float]
    tags: List[str]
    images: List[str]
    description: Optional[str]
    recommend_duration: Optional[int]
    best_season: List[str]
    tips: List[str]
    current_crowd_level: Optional[str]
    real_time_status: Optional[str]
    last_updated: Optional[str]


@router.get("/search", response_model=dict)
@circuit_breaker(failure_threshold=3, recovery_timeout=30)
async def search_attractions(
    keyword: str = Query(..., description="搜索关键词"),
    city: Optional[str] = Query(None, description="城市名称"),
    attraction_type: Optional[str] = Query(None, description="景点类型"),
    radius: int = Query(5000, description="搜索半径(米)"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    sort_by: str = Query("distance", regex="^(distance|rating|hot)$", description="排序方式"),
    longitude: Optional[float] = Query(None, description="经度"),
    latitude: Optional[float] = Query(None, description="纬度")
):
    """搜索景点"""
    try:
        # 应用限流
        async with rate_limiter:
            result = await attraction_service.search_attractions(
                keyword=keyword,
                city=city,
                attraction_type=attraction_type,
                radius=radius,
                page=page,
                page_size=page_size,
                sort_by=sort_by,
                longitude=longitude,
                latitude=latitude
            )

            return {
                "code": 200,
                "message": "success",
                "data": result
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{attraction_id}", response_model=dict)
async def get_attraction_detail(attraction_id: str):
    """获取景点详情"""
    try:
        detail = await attraction_service.get_attraction_detail(attraction_id)
        if not detail:
            raise HTTPException(status_code=404, detail="景点不存在")

        return {
            "code": 200,
            "message": "success",
            "data": detail.to_dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hot/cities", response_model=dict)
async def get_hot_cities():
    """获取热门城市列表"""
    try:
        cities = attraction_service.jiangnan_cities
        return {
            "code": 200,
            "message": "success",
            "data": {
                "cities": cities,
                "count": len(cities)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types", response_model=dict)
async def get_attraction_types():
    """获取景点类型列表"""
    try:
        from app.services.attraction_service import AttractionType
        types = [
            {"value": t.value, "label": t.value}
            for t in AttractionType
        ]
        return {
            "code": 200,
            "message": "success",
            "data": types
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nearby", response_model=dict)
async def get_nearby_attractions(
    longitude: float = Query(..., description="经度"),
    latitude: float = Query(..., description="纬度"),
    radius: int = Query(5000, description="搜索半径(米)"),
    city: Optional[str] = Query(None, description="城市名称")
):
    """获取附近的景点"""
    try:
        # 使用默认关键词搜索附近的景点
        result = await attraction_service.search_attractions(
            keyword="景点",
            city=city,
            radius=radius,
            longitude=longitude,
            latitude=latitude,
            sort_by="distance"
        )

        return {
            "code": 200,
            "message": "success",
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch/details", response_model=dict)
async def get_batch_attraction_details(
    attraction_ids: List[str]
):
    """批量获取景点详情"""
    try:
        details = []
        for attraction_id in attraction_ids:
            detail = await attraction_service.get_attraction_detail(attraction_id)
            if detail:
                details.append(detail.to_dict())

        return {
            "code": 200,
            "message": "success",
            "data": {
                "details": details,
                "count": len(details)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.on_event("shutdown")
async def shutdown_event():
    """关闭服务"""
    await attraction_service.close()