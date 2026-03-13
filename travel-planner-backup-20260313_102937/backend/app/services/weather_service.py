"""
天气服务模块
集成第三方天气 API，提供实时天气查询和预报功能
"""
import httpx
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from app.core.config import settings
from app.core.cache import cached

logger = logging.getLogger(__name__)


@dataclass
class WeatherInfo:
    city: str
    temperature: float
    feels_like: float
    humidity: int
    wind_speed: float
    wind_direction: str
    weather: str
    weather_description: str
    icon: str
    visibility: int
    pressure: int
    update_time: str


@dataclass
class WeatherForecast:
    date: str
    temp_max: float
    temp_min: float
    weather: str
    weather_description: str
    icon: str
    pop: int
    humidity: int
    wind_speed: float


class WeatherService:
    def __init__(self):
        self.api_key = settings.AMAP_API_KEY
        self.base_url = "https://restapi.amap.com/v3/weather"
        self.timeout = 10.0
    
    async def _make_request(self, url: str, params: dict) -> Optional[dict]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"天气 API 请求失败: {response.status_code}")
                    return None
        except httpx.TimeoutException:
            logger.error("天气 API 请求超时")
            return None
        except Exception as e:
            logger.error(f"天气 API 请求异常: {e}")
            return None
    
    @cached(prefix="weather", ttl=1800)
    async def get_current_weather(self, city: str) -> Optional[WeatherInfo]:
        if not self.api_key:
            logger.warning("高德地图 API Key 未配置，返回模拟数据")
            return self._get_mock_weather(city)
        
        params = {
            "key": self.api_key,
            "city": city,
            "extensions": "base"
        }
        
        result = await self._make_request(f"{self.base_url}/weatherInfo", params)
        
        if not result or "lives" not in result:
            return self._get_mock_weather(city)
        
        try:
            live = result["lives"][0]
            return WeatherInfo(
                city=city,
                temperature=float(live.get("temperature", 0)),
                feels_like=float(live.get("feelslike", 0)),
                humidity=int(live.get("humidity", 0)),
                wind_speed=float(live.get("windpower", 0)),
                wind_direction=live.get("winddirection", ""),
                weather=live.get("weather", ""),
                weather_description=live.get("weather", "未知"),
                icon=live.get("weathericon", ""),
                visibility=int(live.get("visibility", 0)),
                pressure=int(live.get("pressure", 0)),
                update_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
        except (KeyError, IndexError) as e:
            logger.error(f"解析天气数据失败: {e}")
            return self._get_mock_weather(city)
    
    @cached(prefix="weather_forecast", ttl=3600)
    async def get_weather_forecast(self, city: str, days: int = 3) -> Optional[List[WeatherForecast]]:
        if not self.api_key:
            logger.warning("高德地图 API Key 未配置，返回模拟数据")
            return self._get_mock_forecast(city, days)
        
        params = {
            "key": self.api_key,
            "city": city,
            "extensions": "all"
        }
        
        result = await self._make_request(f"{self.base_url}/weatherInfo", params)
        
        if not result or "forecasts" not in result:
            return self._get_mock_forecast(city, days)
        
        try:
            forecasts = []
            for forecast in result.get("forecasts", [])[:days]:
                forecasts.append(WeatherForecast(
                    date=forecast.get("date", ""),
                    temp_max=float(forecast.get("temp_max", 0)),
                    temp_min=float(forecast.get("temp_min", 0)),
                    weather=forecast.get("weather", ""),
                    weather_description=forecast.get("weather", "未知"),
                    icon=forecast.get("weathericon", ""),
                    pop=int(forecast.get("pop", 0)),
                    humidity=int(forecast.get("humidity", 0)),
                    wind_speed=float(forecast.get("windpower", 0))
                ))
            return forecasts
        except (KeyError, IndexError) as e:
            logger.error(f"解析天气预报数据失败: {e}")
            return self._get_mock_forecast(city, days)
    
    def _get_mock_weather(self, city: str) -> WeatherInfo:
        mock_data = {
            "杭州": {"temp": 22, "weather": "晴", "humidity": 65},
            "上海": {"temp": 24, "weather": "多云", "humidity": 70},
            "苏州": {"temp": 21, "weather": "晴", "humidity": 60},
            "南京": {"temp": 23, "weather": "阴", "humidity": 75},
        }
        data = mock_data.get(city, {"temp": 22, "weather": "晴", "humidity": 65})
        
        return WeatherInfo(
            city=city,
            temperature=data["temp"],
            feels_like=data["temp"] - 2,
            humidity=data["humidity"],
            wind_speed=3.5,
            wind_direction="东南风",
            weather=data["weather"],
            weather_description=f"{data['weather']}",
            icon="https://webapi.amap.com/weathericon/晴.png",
            visibility=10000,
            pressure=1013,
            update_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
    
    def _get_mock_forecast(self, city: str, days: int) -> List[WeatherForecast]:
        forecasts = []
        base_temp = 22
        
        for i in range(days):
            date = (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")
            forecasts.append(WeatherForecast(
                date=date,
                temp_max=base_temp + i % 2,
                temp_min=base_temp - i % 2 - 2,
                weather="晴" if i % 2 == 0 else "多云",
                weather_description="晴" if i % 2 == 0 else "多云",
                icon="https://webapi.amap.com/weathericon/晴.png",
                pop=10 + i * 5,
                humidity=60 + i * 3,
                wind_speed=3.0 + i * 0.5
            ))
        
        return forecasts
    
    def get_weather_suggestion(self, weather: str) -> str:
        suggestions = {
            "晴": "天气晴朗，适合户外活动，建议做好防晒措施",
            "多云": "天气多云，温度适宜，是出行的好时机",
            "阴": "天气阴沉，可能有雨，建议携带雨具",
            "雨": "下雨天气，建议室内活动或携带雨具",
            "雪": "下雪天气，注意保暖和防滑",
        }
        return suggestions.get(weather, "天气状况良好，祝您旅途愉快")


weather_service = WeatherService()
