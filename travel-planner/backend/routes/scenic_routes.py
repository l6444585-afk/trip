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
        "name": "携程旅行",
        "search_url": "https://you.ctrip.com/sightplace/search.html?keyword={keyword}",
        "icon": "https://webresource.ctrip.com/ResRMSImage/RMSImageAssets/1.0.0/logo.png"
    },
    "qunar": {
        "name": "去哪儿",
        "search_url": "https://travel.qunar.com/p-oi/search?keyword={keyword}",
        "icon": "https://img.qunarzz.com/qunar/touch/v2/images/logo.png"
    },
    "mafengwo": {
        "name": "马蜂窝",
        "search_url": "https://www.mafengwo.cn/search/s.php?q={keyword}",
        "icon": "https://images.mafengwo.net/images/logo/logo.png"
    },
    "meituan": {
        "name": "美团",
        "search_url": "https://www.meituan.com/jd/search/?keyword={keyword}",
        "icon": "https://img.meituan.net/bs/file/?f=logo/logo.png"
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


def format_attraction(a: Attraction) -> dict:
    """
    格式化景区数据
    """
    images = []
    if a.images:
        try:
            if isinstance(a.images, str):
                images = json.loads(a.images)
            else:
                images = a.images
        except:
            images = []
    
    platform_links = {}
    if a.platform_links:
        try:
            if isinstance(a.platform_links, str):
                platform_links = json.loads(a.platform_links)
            else:
                platform_links = a.platform_links
        except:
            platform_links = {}
    
    return {
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
        "images": images,
        "tags": a.tags.split(",") if a.tags else [],
        "booking_required": a.booking_required,
        "platform_links": platform_links if platform_links else {}
    }


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
    
    images = []
    if attraction.images:
        try:
            if isinstance(attraction.images, str):
                images = json.loads(attraction.images)
            else:
                images = attraction.images
        except:
            images = []
    
    platform_links = {}
    if attraction.platform_links:
        try:
            if isinstance(attraction.platform_links, str):
                platform_links = json.loads(attraction.platform_links)
            else:
                platform_links = attraction.platform_links
        except:
            platform_links = {}
    
    if not platform_links:
        for platform, info in PLATFORM_LINKS.items():
            platform_links[platform] = {
                "name": info["name"],
                "url": info["search_url"].format(keyword=attraction.name),
                "icon": info["icon"]
            }
    
    return {
        "success": True,
        "data": {
            "id": attraction.id,
            "name": attraction.name,
            "city": attraction.city,
            "province": attraction.province or get_province_by_city(attraction.city),
            "category": attraction.category,
            "description": attraction.description,
            "latitude": attraction.latitude,
            "longitude": attraction.longitude,
            "address": attraction.address,
            "rating": attraction.rating,
            "popularity": attraction.popularity,
            "avg_visit_duration": attraction.avg_visit_duration,
            "recommended_duration": attraction.recommended_duration,
            "open_time": attraction.open_time,
            "close_time": attraction.close_time,
            "closed_days": attraction.closed_days,
            "ticket_price": attraction.ticket_price,
            "ticket_price_peak": attraction.ticket_price_peak,
            "booking_required": attraction.booking_required,
            "booking_advance_days": attraction.booking_advance_days,
            "booking_url": attraction.booking_url,
            "tags": attraction.tags.split(",") if attraction.tags else [],
            "suitable_for": attraction.suitable_for.split(",") if attraction.suitable_for else [],
            "best_time_to_visit": attraction.best_time_to_visit,
            "peak_hours": attraction.peak_hours,
            "image_url": attraction.image_url,
            "images": images,
            "phone": attraction.phone,
            "website": attraction.website,
            "tips": attraction.tips,
            "warnings": attraction.warnings,
            "platform_links": platform_links,
            "created_at": attraction.created_at,
            "updated_at": attraction.updated_at
        }
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
