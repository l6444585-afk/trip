"""
景区API路由
提供景区数据的CRUD操作、筛选查询、搜索等功能
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime

import json

from database import get_db
from models import Attraction, City
from schemas import AttractionCreate, AttractionResponse

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scenic-spots", tags=["景区管理"])

PROVINCES = {
    "江苏": ["南京", "苏州", "无锡", "常州", "镇江", "扬州", "徐州", "南通", "连云港", "淮安", "盐城", "泰州", "宿迁"],
    "浙江": ["杭州", "宁波", "温州", "绍兴", "湖州", "嘉兴", "金华", "衢州", "台州", "丽水", "舟山"],
    "上海": ["上海"]
}
CATEGORY_TYPES = {
    "自然景观": ["山水风光", "湖泊湿地", "海滨海岛", "森林草原", "地质奇观"],
    "人文历史": ["古镇古村", "历史遗迹", "宗教寺庙", "博物馆", "名人故居"],
    "主题乐园": ["游乐园", "水上乐园", "动物园", "植物园", "影视基地"],
    "都市休闲": ["商业街区", "城市公园", "文化艺术", "网红打卡", "夜景观赏"]
}
PLATFORM_LINKS = {
    "ctrip": {
        "name": "携程",
        "search_url": "https://you.ctrip.com/sight/0/s-{keyword}.html",
    },
    "qunar": {
        "name": "去哪儿",
        "search_url": "https://piao.qunar.com/ticket/list.htm?keyword={keyword}",
    },
    "mafengwo": {
        "name": "马蜂窝",
        "search_url": "https://www.mafengwo.cn/search/q.php?q={keyword}",
    },
    "fliggy": {
        "name": "飞猪旅行",
        "search_url": "https://www.fliggy.com/search/index?searchType=product&keyword={keyword}",
    }
}


def get_province_by_city(city: str) -> str:
    """
    根据城市获取省份
    """
    for province, cities in PROVINCES.items():
        if city in cities:
            return province
    return "未知"


def _parse_json_field(value, default=None):
    """安全解析 JSON 字段"""
    if default is None:
        default = [] if isinstance(default, list) else {}
    if not value:
        return default
    try:
        return json.loads(value) if isinstance(value, str) else value
    except (json.JSONDecodeError, TypeError):
        return default


def _build_platform_links(name, raw_links):
    """构建平台链接，无数据时用默认搜索链接 fallback"""
    links = _parse_json_field(raw_links, {})
    if not links:
        for platform, info in PLATFORM_LINKS.items():
            links[platform] = {
                "name": info["name"],
                "url": info["search_url"].format(keyword=name),
                "icon": info["icon"]
            }
    return links


def format_attraction(a: Attraction, detail=False) -> dict:
    """
    格式化景区数据
    detail=True 时返回完整字段（详情页用）
    """
    data = {
        "id": a.id,
        "name": a.name,
        "city": a.city,
        "province": a.province or get_province_by_city(a.city),
        "category": a.category,
        "description": a.description,
        "latitude": a.latitude,
        "longitude": a.longitude,
        "address": a.address,
        "rating": a.rating,
        "popularity": a.popularity,
        "ticket_price": a.ticket_price,
        "ticket_price_peak": a.ticket_price_peak,
        "open_time": a.open_time,
        "close_time": a.close_time,
        "image_url": a.image_url,
        "images": _parse_json_field(a.images, []),
        "tags": a.tags.split(",") if a.tags else [],
        "booking_required": a.booking_required,
        "platform_links": _build_platform_links(a.name, a.platform_links)
    }

    if detail:
        data.update({
            "avg_visit_duration": a.avg_visit_duration,
            "recommended_duration": a.recommended_duration,
            "closed_days": a.closed_days,
            "booking_advance_days": a.booking_advance_days,
            "booking_url": a.booking_url,
            "suitable_for": a.suitable_for.split(",") if a.suitable_for else [],
            "best_time_to_visit": a.best_time_to_visit,
            "peak_hours": a.peak_hours,
            "phone": a.phone,
            "website": a.website,
            "tips": a.tips,
            "warnings": a.warnings,
            "created_at": a.created_at,
            "updated_at": a.updated_at
        })

    return data


@router.get("/", response_model=dict)
async def get_scenic_spots(
    province: Optional[str] = Query(None, description="省份筛选：江苏/浙江/上海"),
    city: Optional[str] = Query(None, description="城市筛选"),
    category: Optional[str] = Query(None, description="景区类型筛选"),
    sub_category: Optional[str] = Query(None, description="子类型筛选"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    min_price: Optional[float] = Query(None, description="最低门票价格"),
    max_price: Optional[float] = Query(None, description="最高门票价格"),
    min_rating: Optional[float] = Query(None, description="最低评分"),
    sort_by: str = Query("rating", description="排序字段：rating/popularity/ticket_price"),
    sort_order: str = Query("desc", description="排序方向：asc/desc"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(12, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db)
):
    """
    获取景区列表，支持多条件筛选和分页
    """
    query = db.query(Attraction)
    
    if province:
        cities_in_province = PROVINCES.get(province, [])
        if cities_in_province:
            query = query.filter(Attraction.city.in_(cities_in_province))
    
    if city:
        query = query.filter(Attraction.city == city)
    
    if category:
        query = query.filter(Attraction.category == category)
    
    if keyword:
        keyword_filter = or_(
            Attraction.name.contains(keyword),
            Attraction.description.contains(keyword),
            Attraction.address.contains(keyword),
            Attraction.tags.contains(keyword)
        )
        query = query.filter(keyword_filter)
    
    if min_price is not None:
        query = query.filter(Attraction.ticket_price >= min_price)
    if max_price is not None:
        query = query.filter(Attraction.ticket_price <= max_price)
    
    if min_rating is not None:
        query = query.filter(Attraction.rating >= min_rating)
    
    total = query.count()
    
    sort_column = getattr(Attraction, sort_by, Attraction.rating)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    offset = (page - 1) * page_size
    attractions = query.offset(offset).limit(page_size).all()
    
    return {
        "success": True,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "data": [format_attraction(a) for a in attractions]
    }


@router.get("/provinces", response_model=dict)
async def get_provinces():
    """
    获取省份列表及其城市
    """
    return {
        "success": True,
        "provinces": [
            {
                "name": province,
                "cities": cities
            }
            for province, cities in PROVINCES.items()
        ]
    }


@router.get("/categories", response_model=dict)
async def get_categories():
    """
    获取景区类型分类
    """
    return {
        "success": True,
        "categories": [
            {
                "name": category,
                "sub_categories": sub_categories
            }
            for category, sub_categories in CATEGORY_TYPES.items()
        ]
    }


@router.get("/cities/{city}", response_model=dict)
async def get_city_scenic_spots(
    city: str,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    获取指定城市的景区列表
    """
    query = db.query(Attraction).filter(Attraction.city == city)
    
    if category:
        query = query.filter(Attraction.category == category)
    
    total = query.count()
    attractions = query.order_by(Attraction.rating.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "success": True,
        "city": city,
        "province": get_province_by_city(city),
        "total": total,
        "data": [format_attraction(a) for a in attractions]
    }


@router.get("/search", response_model=dict)
async def search_scenic_spots(
    keyword: str = Query(..., min_length=1, description="搜索关键词"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    搜索景区
    """
    query = db.query(Attraction).filter(
        or_(
            Attraction.name.contains(keyword),
            Attraction.description.contains(keyword),
            Attraction.address.contains(keyword),
            Attraction.tags.contains(keyword)
        )
    )
    
    total = query.count()
    attractions = query.order_by(Attraction.rating.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "success": True,
        "keyword": keyword,
        "total": total,
        "data": [format_attraction(a) for a in attractions]
    }


@router.get("/nearby", response_model=dict)
async def get_nearby_scenic_spots(
    latitude: float = Query(..., description="纬度"),
    longitude: float = Query(..., description="经度"),
    radius_km: float = Query(10, ge=0.1, le=100, description="搜索半径(公里)"),
    limit: int = Query(10, ge=1, le=50, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """
    获取附近景区（基于经纬度计算距离）
    """
    import math
    
    def haversine_distance(lat1, lon1, lat2, lon2):
        R = 6371
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = math.sin(dLat/2) * math.sin(dLat/2) + \
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
            math.sin(dLon/2) * math.sin(dLon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    attractions = db.query(Attraction).all()
    
    nearby = []
    for a in attractions:
        if a.latitude and a.longitude:
            distance = haversine_distance(latitude, longitude, a.latitude, a.longitude)
            if distance <= radius_km:
                nearby.append((a, distance))
    
    nearby.sort(key=lambda x: x[1])
    nearby = nearby[:limit]
    
    return {
        "success": True,
        "center": {"latitude": latitude, "longitude": longitude},
        "radius_km": radius_km,
        "count": len(nearby),
        "data": [
            {
                **format_attraction(a),
                "distance_km": round(d, 2)
            }
            for a, d in nearby
        ]
    }


@router.get("/{attraction_id}", response_model=dict)
async def get_scenic_spot_detail(
    attraction_id: int,
    db: Session = Depends(get_db)
):
    """
    获取景区详情
    """
    attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attraction:
        raise HTTPException(status_code=404, detail="景区不存在")

    return {
        "success": True,
        "data": format_attraction(attraction, detail=True)
    }


@router.post("/", response_model=dict)
async def create_scenic_spot(
    attraction: AttractionCreate,
    db: Session = Depends(get_db)
):
    """
    创建景区（管理功能）
    """
    existing = db.query(Attraction).filter(Attraction.name == attraction.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="景区名称已存在")
    
    new_attraction = Attraction(
        name=attraction.name,
        city=attraction.city,
        province=attraction.province,
        category=attraction.category,
        description=attraction.description,
        latitude=attraction.latitude,
        longitude=attraction.longitude,
        address=attraction.address,
        rating=attraction.rating,
        avg_visit_duration=attraction.avg_visit_duration,
        open_time=attraction.open_time,
        close_time=attraction.close_time,
        closed_days=attraction.closed_days,
        ticket_price=attraction.ticket_price,
        ticket_price_peak=attraction.ticket_price_peak,
        booking_required=attraction.booking_required,
        booking_advance_days=attraction.booking_advance_days,
        booking_url=attraction.booking_url,
        tags=",".join(attraction.tags) if attraction.tags else "",
        suitable_for=",".join(attraction.suitable_for) if attraction.suitable_for else "",
        best_time_to_visit=attraction.best_time_to_visit,
        peak_hours=attraction.peak_hours,
        image_url=attraction.image_url,
        images=json.dumps(attraction.images) if attraction.images else None,
        phone=attraction.phone,
        website=attraction.website,
        tips=attraction.tips,
        warnings=attraction.warnings,
        platform_links=json.dumps(attraction.platform_links) if attraction.platform_links else None
    )
    
    db.add(new_attraction)
    db.commit()
    db.refresh(new_attraction)
    
    return {
        "success": True,
        "message": "景区创建成功",
        "data": format_attraction(new_attraction)
    }


@router.put("/{attraction_id}", response_model=dict)
async def update_scenic_spot(
    attraction_id: int,
    attraction: AttractionCreate,
    db: Session = Depends(get_db)
):
    """
    更新景区信息（管理功能）
    """
    existing = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="景区不存在")
    
    for key, value in attraction.dict().items():
        if key == "tags":
            setattr(existing, key, ",".join(value) if value else "")
        elif key == "suitable_for":
            setattr(existing, key, ",".join(value) if value else "")
        elif key == "images":
            setattr(existing, key, json.dumps(value) if value else None)
        elif key == "platform_links":
            setattr(existing, key, json.dumps(value) if value else None)
        else:
            setattr(existing, key, value)
    
    existing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(existing)
    
    return {
        "success": True,
        "message": "景区更新成功",
        "data": format_attraction(existing)
    }


@router.delete("/{attraction_id}", response_model=dict)
async def delete_scenic_spot(
    attraction_id: int,
    db: Session = Depends(get_db)
):
    """
    删除景区（管理功能）
    """
    attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attraction:
        raise HTTPException(status_code=404, detail="景区不存在")
    
    db.delete(attraction)
    db.commit()
    
    return {
        "success": True,
        "message": "景区删除成功"
    }


@router.get("/stats/overview", response_model=dict)
async def get_scenic_stats(db: Session = Depends(get_db)):
    """
    获取景区统计概览
    """
    total = db.query(Attraction).count()
    
    province_stats = {}
    for province, cities in PROVINCES.items():
        count = db.query(Attraction).filter(Attraction.city.in_(cities)).count()
        province_stats[province] = count
    
    category_stats = {}
    for category in CATEGORY_TYPES.keys():
        count = db.query(Attraction).filter(Attraction.category == category).count()
        category_stats[category] = count
    
    top_rated = db.query(Attraction).order_by(Attraction.rating.desc()).limit(5).all()
    top_popular = db.query(Attraction).order_by(Attraction.popularity.desc()).limit(5).all()
    
    return {
        "success": True,
        "total": total,
        "by_province": province_stats,
        "by_category": category_stats,
        "top_rated": [format_attraction(a) for a in top_rated],
        "top_popular": [format_attraction(a) for a in top_popular]
    }
