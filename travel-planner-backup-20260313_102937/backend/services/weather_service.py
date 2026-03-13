"""
天气服务模块
集成第三方天气API，提供实时天气数据、支持多日预报和天气预警
"""
import requests
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
import os

logger = logging.getLogger(__name__)


@dataclass
class WeatherInfo:
    city: str
    temperature: float
    feels_like: float
    humidity: int
    weather: str
    wind_speed: float
    wind_direction: str
    visibility: str
    pressure: float
    uv_index: int
    aqi: int
    pm25: float
    update_time: datetime


@dataclass
class WeatherForecast:
    date: str
    weather: str
    temp_high: float
    temp_low: float
    humidity: int
    wind_speed: float
    precipitation: float
    description: str


@dataclass
class WeatherAlert:
    type: str
    level: str
    title: str
    description: str
    start_time: datetime
    end_time: Optional[datetime]


class WeatherService:
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.openweathermap.org/data/2.5"):
        self.api_key = api_key or os.getenv("WEATHER_API_KEY", "")
        self.base_url = base_url
        self.cache: Dict[str, WeatherInfo] = {}
        self.cache_ttl: int = 1800
        
    def _get_cache_key(self, city: str) -> str:
        return f"weather:{city.lower()}"
    
    def _is_cache_valid(self, cached: WeatherInfo) -> bool:
        return datetime.now() < cached.update_time + timedelta(seconds=self.cache_ttl)
    
    def get_weather(self, city: str) -> Optional[WeatherInfo]:
        cache_key = self._get_cache_key(city)
        
        if city.lower() in self.cache:
            cached = self.cache[city.lower()]
            if self._is_cache_valid(cached):
                logger.info(f"从缓存获取天气数据: {city}")
                return cached
        
        
        try:
            params = {
                "q": city,
                "appid": self.api_key,
                "units": "metric",
                "lang": "zh_cn"
            }
            
            response = requests.get(self.base_url, params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            weather_info = WeatherInfo(
                city=city,
                temperature=data["main"]["temp"],
                feels_like=data["main"]["feels_like"],
                humidity=data["main"]["humidity"],
                weather=data["weather"][0]["main"],
                wind_speed=data["wind"]["speed"],
                wind_direction=data["wind"].get("deg", ""),
                visibility=data["visibility"],
                pressure=data["main"]["pressure"],
                uv_index=data.get("main", {}).get("uvi", 0),
                aqi=data.get("main", {}).get("aqi", 0),
                pm25=data.get("main", {}).get("pm2_5", 0),
                update_time=datetime.now()
            )
            
            self.cache[city.lower()] = weather_info
            logger.info(f"天气数据已缓存: {city}")
            
            return weather_info
            
            
        except requests.RequestException as e:
            logger.error(f"获取天气数据失败: {e}")
            return None
        except Exception as e:
            logger.error(f"解析天气数据失败: {e}")
            return None
    
    def get_forecast(self, city: str, days: int = 3) -> Optional[List[WeatherForecast]]:
        try:
            params = {
                "q": city,
                "appid": self.api_key,
                "units": "metric",
                "lang": "zh_cn",
                "cnt": days
            }
            
            response = requests.get(
                f"{self.base_url}/forecast",
                params=params,
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            
            forecasts = []
            for item in data.get("list", []):
                forecast = WeatherForecast(
                    date=item.get("dt_txt"),
                    weather=item["weather"][0]["main"],
                    temp_high=item["main"]["temp_max"],
                    temp_low=item["main"]["temp_min"],
                    humidity=item["main"]["humidity"],
                    wind_speed=item["wind"]["speed"],
                    precipitation=item.get("pop", 0),
                    description=item.get("description", "")
                )
                forecasts.append(forecast)
            
            return forecasts
            
            
        except requests.RequestException as e:
            logger.error(f"获取天气预报失败: {e}")
            return None
        except Exception as e:
            logger.error(f"解析天气预报失败: {e}")
            return None
    
    def get_weather_alerts(self, city: str) -> Optional[List[WeatherAlert]]:
        mock_alerts = [
            WeatherAlert(
                type="暴雨预警",
                level="黄色",
                title="暴雨黄色预警",
                description="预计未来6小时内将出现暴雨天气",
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(hours=6)
            ),
            WeatherAlert(
                type="高温预警",
                level="橙色",
                title="高温橙色预警",
                description="气温将超过35°C，注意防暑",
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(hours=12)
            )
        ]
        return mock_alerts
    
    def get_multi_city_weather(self, cities: List[str]) -> Dict[str, Optional[WeatherInfo]]:
        results = {}
        for city in cities:
            weather = self.get_weather(city)
            if weather:
                results[city] = weather
        return results
    
    def clear_cache(self, city: Optional[str] = None):
        if city:
            self.cache.pop(city.lower(), None)
        else:
            self.cache.clear()
        logger.info("天气缓存已清除")


weather_service = WeatherService()


def get_weather_service() -> WeatherService:
    return weather_service
