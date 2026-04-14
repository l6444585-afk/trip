"""
酒店推荐API路由
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta

from database import get_db
from hotel_recommendation_service import HotelRecommendationService, Hotel
from models import Attraction

router = APIRouter(prefix="/api/hotels", tags=["酒店推荐"])


@router.get("/search", response_model=dict)
async def search_hotels(
    latitude: float = Query(..., description="中心点纬度"),
    longitude: float = Query(..., description="中心点经度"),
    radius: int = Query(5000, description="搜索半径(米)", ge=100, le=50000),
    city: Optional[str] = Query(None, description="城市名称"),
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    check_in: Optional[str] = Query(None, description="入住日期(YYYY-MM-DD)"),
    check_out: Optional[str] = Query(None, description="离店日期(YYYY-MM-DD)"),
    limit: int = Query(60, description="返回数量", ge=1, le=60),
    use_mock: bool = Query(False, description="是否使用模拟数据"),
    db: Session = Depends(get_db)
):
    """
    搜索附近酒店
    
    整合高德地图API，支持多平台预订跳转
    当高德API不可用时，可使用模拟数据
    """
    try:
        service = HotelRecommendationService(db=db)
        
        if use_mock or not service.amap_api_key:
            city_name = city or "杭州"
            mock_hotels = service.generate_mock_hotels(
                city=city_name,
                latitude=latitude,
                longitude=longitude,
                count=limit,
                check_in=check_in,
                check_out=check_out
            )
            return {
                "success": True,
                "center": {"latitude": latitude, "longitude": longitude},
                "radius_m": radius,
                "count": len(mock_hotels),
                "hotels": [h.to_dict() for h in mock_hotels],
                "data_source": "mock",
                "message": "使用模拟数据展示，配置高德地图API Key后可获取真实数据"
            }
        
        amap_hotels = await service.search_hotels_amap(
            latitude=latitude,
            longitude=longitude,
            radius=radius,
            keywords=keyword,
            city=city,
            page_size=limit
        )

        # 高德返回空结果时（key 受限 / API 异常），降级到 mock 保证答辩可用
        if not amap_hotels:
            city_name = city or "杭州"
            mock_hotels = service.generate_mock_hotels(
                city=city_name,
                latitude=latitude,
                longitude=longitude,
                count=limit,
                check_in=check_in,
                check_out=check_out
            )
            return {
                "success": True,
                "center": {"latitude": latitude, "longitude": longitude},
                "radius_m": radius,
                "count": len(mock_hotels),
                "hotels": [h.to_dict() for h in mock_hotels],
                "data_source": "mock_fallback",
                "message": "高德地图暂无数据，已切换备用数据"
            }

        for hotel in amap_hotels:
            hotel.booking_links = service.generate_booking_links(
                hotel_name=hotel.name,
                city=hotel.city,
                check_in=check_in,
                check_out=check_out,
                latitude=hotel.latitude,
                longitude=hotel.longitude
            )
            if hotel.booking_links:
                hotel.booking_url = hotel.booking_links.get("ctrip", "")

        amap_hotels.sort(key=lambda h: h.distance_km or float("inf"))

        return {
            "success": True,
            "center": {"latitude": latitude, "longitude": longitude},
            "radius_m": radius,
            "count": len(amap_hotels[:limit]),
            "hotels": [h.to_dict() for h in amap_hotels[:limit]],
            "data_source": "amap"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索酒店失败: {str(e)}")


@router.get("/nearby/{attraction_id}", response_model=dict)
async def get_hotels_near_attraction(
    attraction_id: int,
    radius_km: float = Query(3.0, description="搜索半径(公里)", ge=0.5, le=20),
    check_in: Optional[str] = Query(None, description="入住日期(YYYY-MM-DD)"),
    check_out: Optional[str] = Query(None, description="离店日期(YYYY-MM-DD)"),
    limit: int = Query(10, description="返回数量", ge=1, le=30),
    db: Session = Depends(get_db)
):
    """
    获取景点附近酒店
    
    根据景点位置推荐周边酒店
    """
    try:
        attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
        if not attraction:
            raise HTTPException(status_code=404, detail="景点不存在")
        
        if not attraction.latitude or not attraction.longitude:
            raise HTTPException(status_code=400, detail="景点缺少位置信息")
        
        service = HotelRecommendationService(db=db)
        
        hotels = await service.recommend_hotels_for_attraction(
            attraction_lat=attraction.latitude,
            attraction_lon=attraction.longitude,
            attraction_name=attraction.name,
            city=attraction.city,
            check_in=check_in,
            check_out=check_out,
            radius_km=radius_km,
            limit=limit
        )

        # AMap 返回空时降级 mock
        data_source = "amap"
        if not hotels:
            hotels = service.generate_mock_hotels(
                city=attraction.city or "杭州",
                latitude=attraction.latitude,
                longitude=attraction.longitude,
                count=limit,
                check_in=check_in,
                check_out=check_out
            )
            data_source = "mock_fallback"

        return {
            "success": True,
            "attraction": {
                "id": attraction.id,
                "name": attraction.name,
                "latitude": attraction.latitude,
                "longitude": attraction.longitude
            },
            "radius_km": radius_km,
            "count": len(hotels),
            "hotels": [h.to_dict() for h in hotels],
            "data_source": data_source
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取附近酒店失败: {str(e)}")


@router.get("/price/{sh_id}", response_model=dict)
async def get_hotel_price(
    sh_id: str,
    check_in: str = Query(..., description="入住日期(YYYY-MM-DD)"),
    check_out: str = Query(..., description="离店日期(YYYY-MM-DD)"),
    user_id: Optional[int] = Query(None, description="用户ID"),
    db: Session = Depends(get_db)
):
    """
    获取酒店实时价格
    
    通过飞猪四海通API获取酒店实时价格和房态
    """
    try:
        service = HotelRecommendationService(db=db)
        
        price_info = await service.get_hotel_price(
            sh_id=sh_id,
            check_in=check_in,
            check_out=check_out,
            user_id=user_id
        )
        
        if not price_info:
            return {
                "success": False,
                "message": "无法获取价格信息，请稍后重试",
                "sh_id": sh_id
            }
        
        return {
            "success": True,
            "price_info": price_info.to_dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取价格失败: {str(e)}")


@router.get("/detail/{hotel_id}", response_model=dict)
async def get_hotel_detail(
    hotel_id: str,
    activity_id: str = Query("sht_zb_travel", description="活动编码"),
    promotion_position_id: int = Query(0, description="推广位ID"),
    promote_app_key: int = Query(0, description="媒体ID"),
    db: Session = Depends(get_db)
):
    """
    获取酒店详细信息
    
    通过飞猪四海通API (alibaba.fliggy.promote.hotel.details) 获取酒店详细信息
    
    返回信息包括：
    - 酒店基本信息（名称、地址、城市、经纬度等）
    - 酒店类型和星级
    - 品牌和集团信息
    - 酒店设施列表
    - 房间列表和房型信息
    - 入住/离店时间
    - 政策信息（早餐、取消、宠物等）
    """
    try:
        service = HotelRecommendationService(db=db)
        
        hotel_detail = await service.get_hotel_details(
            hotel_id=hotel_id,
            activity_id=activity_id,
            promotion_position_id=promotion_position_id,
            promote_app_key=promote_app_key
        )
        
        if not hotel_detail:
            return {
                "success": False,
                "message": "无法获取酒店详情，请确认酒店ID是否正确",
                "hotel_id": hotel_id
            }
        
        return {
            "success": True,
            "hotel": hotel_detail
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取酒店详情失败: {str(e)}")


@router.post("/recommend-for-itinerary", response_model=dict)
async def recommend_hotels_for_itinerary(
    attraction_ids: str = Query(..., description="景点ID列表,逗号分隔"),
    check_in_date: Optional[str] = Query(None, description="入住日期(YYYY-MM-DD)"),
    budget_per_night: Optional[int] = Query(None, description="每晚预算(元)"),
    prefer_city: Optional[str] = Query(None, description="首选城市"),
    db: Session = Depends(get_db)
):
    """
    为行程推荐酒店
    
    根据行程中的景点位置，智能推荐住宿酒店
    """
    try:
        ids = [int(id.strip()) for id in attraction_ids.split(",")]
        attractions = db.query(Attraction).filter(Attraction.id.in_(ids)).all()
        
        if not attractions:
            return {
                "success": True,
                "message": "未找到景点信息",
                "recommendations": {}
            }
        
        from collections import defaultdict
        daily_attractions = defaultdict(list)
        
        for i, attraction in enumerate(attractions):
            day = (i // 3) + 1
            daily_attractions[day].append({
                "id": attraction.id,
                "name": attraction.name,
                "latitude": attraction.latitude,
                "longitude": attraction.longitude,
                "city": attraction.city
            })
        
        daily_list = [
            {"day": day, "attractions": attractions}
            for day, attractions in sorted(daily_attractions.items())
        ]
        
        service = HotelRecommendationService(db=db)
        
        recommendations = await service.recommend_hotels_for_itinerary(
            daily_attractions=daily_list,
            check_in_date=check_in_date,
            budget_per_night=budget_per_night,
            prefer_city=prefer_city
        )
        
        return {
            "success": True,
            "total_days": len(recommendations),
            "recommendations": {
                day: [h.to_dict() for h in hotels]
                for day, hotels in recommendations.items()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"推荐酒店失败: {str(e)}")


@router.get("/by-city/{city}", response_model=dict)
async def get_hotels_by_city(
    city: str,
    check_in: Optional[str] = Query(None, description="入住日期(YYYY-MM-DD)"),
    check_out: Optional[str] = Query(None, description="离店日期(YYYY-MM-DD)"),
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    price_min: Optional[int] = Query(None, description="最低价格"),
    price_max: Optional[int] = Query(None, description="最高价格"),
    limit: int = Query(60, description="返回数量", ge=1, le=60),
    use_mock: bool = Query(False, description="是否使用模拟数据"),
    db: Session = Depends(get_db)
):
    """
    按城市搜索酒店
    
    支持多平台预订跳转链接
    """
    try:
        service = HotelRecommendationService(db=db)
        
        city_info = service.JIANGNAN_CITIES.get(city)
        if not city_info:
            raise HTTPException(status_code=400, detail=f"不支持的城市: {city}")
        
        center_lat, center_lon = city_info["center"]
        
        if use_mock or not service.amap_api_key:
            mock_hotels = service.generate_mock_hotels(
                city=city,
                latitude=center_lat,
                longitude=center_lon,
                count=limit,
                check_in=check_in,
                check_out=check_out
            )
            
            if price_min:
                mock_hotels = [h for h in mock_hotels if h.price_min and h.price_min >= price_min]
            if price_max:
                mock_hotels = [h for h in mock_hotels if not h.price_min or h.price_min <= price_max]
            
            return {
                "success": True,
                "city": city,
                "count": len(mock_hotels[:limit]),
                "hotels": [h.to_dict() for h in mock_hotels[:limit]],
                "data_source": "mock",
                "message": "使用模拟数据展示，配置高德地图API Key后可获取真实数据"
            }
        
        hotels = await service.search_hotels_amap(
            latitude=center_lat,
            longitude=center_lon,
            radius=10000,
            keywords=keyword,
            city=city,
            page_size=limit
        )

        # 高德返回空结果时降级到 mock
        if not hotels:
            mock_hotels = service.generate_mock_hotels(
                city=city,
                latitude=center_lat,
                longitude=center_lon,
                count=limit,
                check_in=check_in,
                check_out=check_out
            )
            if price_min:
                mock_hotels = [h for h in mock_hotels if h.price_min and h.price_min >= price_min]
            if price_max:
                mock_hotels = [h for h in mock_hotels if not h.price_min or h.price_min <= price_max]
            return {
                "success": True,
                "city": city,
                "count": len(mock_hotels[:limit]),
                "hotels": [h.to_dict() for h in mock_hotels[:limit]],
                "data_source": "mock_fallback",
                "message": "高德地图暂无数据，已切换备用数据"
            }

        for hotel in hotels:
            hotel.booking_links = service.generate_booking_links(
                hotel_name=hotel.name,
                city=hotel.city,
                check_in=check_in,
                check_out=check_out,
                latitude=hotel.latitude,
                longitude=hotel.longitude
            )
            if hotel.booking_links:
                hotel.booking_url = hotel.booking_links.get("ctrip", "")

        if price_min:
            hotels = [h for h in hotels if h.price_min and h.price_min >= price_min]
        if price_max:
            hotels = [h for h in hotels if not h.price_min or h.price_min <= price_max]

        hotels.sort(key=lambda h: h.rating or 0, reverse=True)

        return {
            "success": True,
            "city": city,
            "count": len(hotels[:limit]),
            "hotels": [h.to_dict() for h in hotels[:limit]],
            "data_source": "amap"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索酒店失败: {str(e)}")


@router.get("/booking-links", response_model=dict)
async def generate_booking_links(
    hotel_name: str = Query(..., description="酒店名称"),
    city: str = Query(..., description="城市名称"),
    check_in: Optional[str] = Query(None, description="入住日期(YYYY-MM-DD)"),
    check_out: Optional[str] = Query(None, description="离店日期(YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    生成多平台预订链接
    
    支持平台：
    - 飞猪 (Fliggy)
    - 携程 (Ctrip)
    - 美团 (Meituan)
    - 去哪儿 (Qunar)
    """
    try:
        service = HotelRecommendationService(db=db)
        
        booking_links = service.generate_booking_links(
            hotel_name=hotel_name,
            city=city,
            check_in=check_in,
            check_out=check_out
        )
        
        return {
            "success": True,
            "hotel_name": hotel_name,
            "city": city,
            "check_in": check_in,
            "check_out": check_out,
            "booking_links": booking_links,
            "platforms": {
                "fliggy": {"name": "飞猪", "url": booking_links.get("fliggy", "")},
                "ctrip": {"name": "携程", "url": booking_links.get("ctrip", "")},
                "meituan": {"name": "美团", "url": booking_links.get("meituan", "")},
                "qunar": {"name": "去哪儿", "url": booking_links.get("qunar", "")}
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成预订链接失败: {str(e)}")


@router.get("/supported-cities", response_model=dict)
async def get_supported_cities():
    """
    获取支持的城市列表
    """
    cities = []
    for city_name, city_info in HotelRecommendationService.JIANGNAN_CITIES.items():
        cities.append({
            "name": city_name,
            "city_id": city_info["city_id"],
            "center_latitude": city_info["center"][0],
            "center_longitude": city_info["center"][1]
        })
    
    return {
        "success": True,
        "count": len(cities),
        "cities": cities
    }


@router.get("/product/{hid}", response_model=dict)
async def get_hotel_product(
    hid: str,
    outer_id: Optional[str] = Query(None, description="外部酒店ID"),
    shid: Optional[str] = Query(None, description="标准酒店ID"),
    db: Session = Depends(get_db)
):
    """
    获取酒店商品信息
    
    通过飞猪酒店商品API (taobao.xhotel.get) 获取酒店详细信息
    需要商家授权
    """
    try:
        service = HotelRecommendationService(db=db)
        
        hotel_info = await service.get_hotel_product_info(
            hid=hid,
            outer_id=outer_id,
            shid=shid
        )
        
        if not hotel_info:
            return {
                "success": False,
                "message": "无法获取酒店商品信息",
                "hid": hid
            }
        
        return {
            "success": True,
            "hotel": hotel_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取酒店商品信息失败: {str(e)}")


@router.get("/product/{hid}/rooms", response_model=dict)
async def get_hotel_rooms(
    hid: str,
    outer_id: Optional[str] = Query(None, description="外部ID"),
    db: Session = Depends(get_db)
):
    """
    获取酒店房型列表
    
    通过飞猪酒店商品API (taobao.xhotel.roomtype.get) 获取房型信息
    需要商家授权
    """
    try:
        service = HotelRecommendationService(db=db)
        
        rooms = await service.get_hotel_room_types(
            hid=hid,
            outer_id=outer_id
        )
        
        if rooms is None:
            return {
                "success": False,
                "message": "无法获取房型信息",
                "hid": hid
            }
        
        return {
            "success": True,
            "hid": hid,
            "count": len(rooms),
            "rooms": rooms
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取房型信息失败: {str(e)}")


@router.get("/product/{hid}/rateplans", response_model=dict)
async def get_hotel_rateplans(
    hid: str,
    outer_id: Optional[str] = Query(None, description="外部ID"),
    db: Session = Depends(get_db)
):
    """
    获取酒店价格计划
    
    通过飞猪酒店商品API (taobao.xhotel.rateplan.get) 获取价格计划
    需要商家授权
    """
    try:
        service = HotelRecommendationService(db=db)
        
        rateplans = await service.get_hotel_rate_plans(
            hid=hid,
            outer_id=outer_id
        )
        
        if rateplans is None:
            return {
                "success": False,
                "message": "无法获取价格计划",
                "hid": hid
            }
        
        return {
            "success": True,
            "hid": hid,
            "count": len(rateplans),
            "rateplans": rateplans
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取价格计划失败: {str(e)}")


@router.get("/product/{hid}/room-price", response_model=dict)
async def get_hotel_room_with_price(
    hid: str,
    shid: Optional[str] = Query(None, description="标准酒店ID"),
    check_in: Optional[str] = Query(None, description="入住日期(YYYY-MM-DD)"),
    check_out: Optional[str] = Query(None, description="离店日期(YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    获取酒店房型与房价
    
    通过飞猪酒店商品API (taobao.xhotel.baseinfo.room.get) 获取房型房价
    需要商家授权
    """
    try:
        service = HotelRecommendationService(db=db)
        
        result = await service.get_hotel_room_with_price(
            hid=hid,
            shid=shid,
            check_in=check_in,
            check_out=check_out
        )
        
        if not result:
            return {
                "success": False,
                "message": "无法获取房型房价信息",
                "hid": hid
            }
        
        return {
            "success": True,
            "hid": hid,
            **result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取房型房价失败: {str(e)}")
