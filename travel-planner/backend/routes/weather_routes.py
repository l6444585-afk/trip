"""
天气相关API路由
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from services.weather_service import weather_service, WeatherInfo, WeatherForecast, WeatherAlert

from app.core.cache import cached
import logging

from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/weather")


@router.get("/current/{city}")
async def get_current_weather(city: str):
    try:
        weather = weather_service.get_current_weather(city)
        if weather is None:
            raise HTTPException(status_code=404, detail=f"无法获取{city}的天气数据")
        return weather
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取天气数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取天气数据失败: {str(e)}")


@router.get("/forecast/{city}")
async def get_weather_forecast(
    city: str,
    days: int = Query(default=3, ge=3, le=7)
):
    try:
        if days < 1 or days > 7:
            raise HTTPException(status_code=400, detail="days参数必须在1-7之间")
        
        forecast = weather_service.get_forecast(city, days)
        if forecast is None:
            raise HTTPException(status_code=404, detail=f"无法获取{city}的天气预报数据")
        return {"city": city, "days": days, "forecast": forecast}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取天气预报数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取天气预报数据失败: {str(e)}")


@router.get("/alerts/{city}")
async def get_weather_alerts(city: str):
    try:
        alerts = weather_service.get_weather_alerts(city)
        return {"city": city, "alerts": alerts or []}
    except Exception as e:
        logger.error(f"获取天气预警失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取天气预警失败: {str(e)}")


@router.get("/multi")
async def get_multi_city_weather(cities: str = Query(...)):
    try:
        city_list = [c.strip() for c in cities.split(",") if c.strip()]
        if not city_list:
            raise HTTPException(status_code=400, detail="cities参数不能为空")
        
        weather_data = weather_service.get_multi_city_weather(city_list)
        return weather_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取多城市天气数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取多城市天气数据失败: {str(e)}")
