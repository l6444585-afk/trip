"""
数据分析服务模块
支持用户行为分析、业务数据统计、趋势分析等
"""
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from collections import defaultdict
import math

logger = logging.getLogger(__name__)


@dataclass
class DailyStats:
    date: str
    new_users: int
    active_users: int
    new_orders: int
    revenue: float
    page_views: int
    sessions: int


@dataclass
class UserBehaviorStats:
    user_id: int
    total_views: int
    total_searches: int
    total_bookings: int
    favorite_cities: List[str]
    avg_session_duration: float
    last_active: datetime


@dataclass
class TrendData:
    metric: str
    current_value: float
    previous_value: float
    change_rate: float
    trend: str


class AnalyticsService:
    def __init__(self):
        self.daily_stats: Dict[str, DailyStats] = {}
        self.user_behaviors: Dict[int, UserBehaviorStats] = {}
        self.event_logs: List[Dict] = []
        self._init_mock_data()
    
    def _init_mock_data(self):
        today = datetime.now()
        
        for i in range(30):
            date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            self.daily_stats[date] = DailyStats(
                date=date,
                new_users=50 + i * 2,
                active_users=200 + i * 5,
                new_orders=30 + i,
                revenue=5000 + i * 200,
                page_views=1000 + i * 50,
                sessions=500 + i * 20
            )
    
    def track_event(
        self,
        user_id: int,
        event_type: str,
        event_data: Dict = None,
        session_id: str = None
    ):
        event = {
            "user_id": user_id,
            "event_type": event_type,
            "event_data": event_data or {},
            "session_id": session_id,
            "timestamp": datetime.now(),
            "date": datetime.now().strftime("%Y-%m-%d")
        }
        
        self.event_logs.append(event)
        
        self._update_user_behavior(user_id, event_type, event_data)
        
        if len(self.event_logs) > 100000:
            self.event_logs = self.event_logs[-50000:]
    
    def _update_user_behavior(
        self,
        user_id: int,
        event_type: str,
        event_data: Dict
    ):
        if user_id not in self.user_behaviors:
            self.user_behaviors[user_id] = UserBehaviorStats(
                user_id=user_id,
                total_views=0,
                total_searches=0,
                total_bookings=0,
                favorite_cities=[],
                avg_session_duration=0,
                last_active=datetime.now()
            )
        
        behavior = self.user_behaviors[user_id]
        
        if event_type == "page_view":
            behavior.total_views += 1
        elif event_type == "search":
            behavior.total_searches += 1
        elif event_type == "booking":
            behavior.total_bookings += 1
        
        if event_data and "city" in event_data:
            city = event_data["city"]
            if city not in behavior.favorite_cities:
                behavior.favorite_cities.append(city)
        
        behavior.last_active = datetime.now()
    
    def get_dashboard_stats(self, days: int = 7) -> Dict[str, Any]:
        today = datetime.now()
        stats_list = []
        
        for i in range(days):
            date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            if date in self.daily_stats:
                stats_list.append(self.daily_stats[date])
        
        total_new_users = sum(s.new_users for s in stats_list)
        total_active_users = sum(s.active_users for s in stats_list)
        total_orders = sum(s.new_orders for s in stats_list)
        total_revenue = sum(s.revenue for s in stats_list)
        total_page_views = sum(s.page_views for s in stats_list)
        
        return {
            "period": f"最近{days}天",
            "summary": {
                "new_users": total_new_users,
                "active_users": total_active_users,
                "orders": total_orders,
                "revenue": total_revenue,
                "page_views": total_page_views
            },
            "daily_stats": [
                {
                    "date": s.date,
                    "new_users": s.new_users,
                    "active_users": s.active_users,
                    "orders": s.new_orders,
                    "revenue": s.revenue
                }
                for s in reversed(stats_list)
            ],
            "trends": self._calculate_trends(stats_list)
        }
    
    def _calculate_trends(self, stats_list: List[DailyStats]) -> Dict[str, TrendData]:
        if len(stats_list) < 2:
            return {}
        
        current = stats_list[0]
        previous = stats_list[-1]
        
        def calc_trend(current_val: float, previous_val: float) -> Dict:
            if previous_val == 0:
                change_rate = 100 if current_val > 0 else 0
            else:
                change_rate = ((current_val - previous_val) / previous_val) * 100
            
            if change_rate > 5:
                trend = "up"
            elif change_rate < -5:
                trend = "down"
            else:
                trend = "stable"
            
            return {
                "current_value": current_val,
                "previous_value": previous_val,
                "change_rate": round(change_rate, 2),
                "trend": trend
            }
        
        return {
            "new_users": calc_trend(current.new_users, previous.new_users),
            "active_users": calc_trend(current.active_users, previous.active_users),
            "orders": calc_trend(current.new_orders, previous.new_orders),
            "revenue": calc_trend(current.revenue, previous.revenue)
        }
    
    def get_user_analytics(self, user_id: int) -> Optional[Dict]:
        if user_id not in self.user_behaviors:
            return None
        
        behavior = self.user_behaviors[user_id]
        
        return {
            "user_id": user_id,
            "total_views": behavior.total_views,
            "total_searches": behavior.total_searches,
            "total_bookings": behavior.total_bookings,
            "favorite_cities": behavior.favorite_cities[:5],
            "last_active": behavior.last_active.isoformat(),
            "engagement_score": self._calculate_engagement_score(behavior)
        }
    
    def _calculate_engagement_score(self, behavior: UserBehaviorStats) -> float:
        score = 0.0
        
        score += min(behavior.total_views / 10, 30)
        score += min(behavior.total_searches / 5, 20)
        score += min(behavior.total_bookings * 10, 50)
        
        days_since_active = (datetime.now() - behavior.last_active).days
        if days_since_active < 1:
            score += 10
        elif days_since_active < 7:
            score += 5
        
        return min(100, score)
    
    def get_popular_destinations(self, limit: int = 10) -> List[Dict]:
        city_counts = defaultdict(int)
        
        for event in self.event_logs:
            if event["event_type"] in ["search", "booking", "view"]:
                city = event["event_data"].get("city")
                if city:
                    city_counts[city] += 1
        
        sorted_cities = sorted(city_counts.items(), key=lambda x: x[1], reverse=True)
        
        return [
            {"city": city, "count": count}
            for city, count in sorted_cities[:limit]
        ]
    
    def get_conversion_funnel(self) -> Dict[str, Any]:
        views = len([e for e in self.event_logs if e["event_type"] == "page_view"])
        searches = len([e for e in self.event_logs if e["event_type"] == "search"])
        bookings = len([e for e in self.event_logs if e["event_type"] == "booking"])
        
        return {
            "stages": [
                {"name": "浏览", "count": views},
                {"name": "搜索", "count": searches},
                {"name": "预订", "count": bookings}
            ],
            "conversion_rates": {
                "view_to_search": (searches / views * 100) if views > 0 else 0,
                "search_to_booking": (bookings / searches * 100) if searches > 0 else 0,
                "overall": (bookings / views * 100) if views > 0 else 0
            }
        }
    
    def get_revenue_analytics(self, days: int = 30) -> Dict[str, Any]:
        today = datetime.now()
        daily_revenue = []
        
        for i in range(days):
            date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            if date in self.daily_stats:
                daily_revenue.append({
                    "date": date,
                    "revenue": self.daily_stats[date].revenue,
                    "orders": self.daily_stats[date].new_orders
                })
        
        total_revenue = sum(d["revenue"] for d in daily_revenue)
        total_orders = sum(d["orders"] for d in daily_revenue)
        
        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "average_order_value": total_revenue / total_orders if total_orders > 0 else 0,
            "daily_revenue": list(reversed(daily_revenue))
        }


analytics_service = AnalyticsService()


def get_analytics_service() -> AnalyticsService:
    return analytics_service
