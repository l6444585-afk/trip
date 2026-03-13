"""
行程分享服务模块
支持行程分享、社交化功能
"""
import qrcode
import io
import base64
import logging
import json
import hashlib
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from sqlalchemy.orm import Session
from models import Itinerary, User
import secrets

logger = logging.getLogger(__name__)


@dataclass
class ShareInfo:
    share_code: str
    share_url: str
    qr_code: str
    expire_time: str
    view_count: int
    like_count: int


@dataclass
class SharedItinerary:
    share_code: str
    title: str
    author: str
    days: int
    cities: List[str]
    budget: float
    style: str
    highlights: List[str]
    content: Dict[str, Any]
    view_count: int
    like_count: int
    create_time: str


class ShareService:
    def __init__(self):
        self.base_url = "http://localhost:3000/share"
        self.share_cache: Dict[str, Dict[str, Any]] = {}
    
    def generate_share_code(self, itinerary_id: int, user_id: int) -> str:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_str = secrets.token_hex(4)
        raw = f"{itinerary_id}_{user_id}_{timestamp}_{random_str}"
        return hashlib.md5(raw.encode()).hexdigest()[:12].upper()
    
    def create_share(
        self,
        db: Session,
        itinerary_id: int,
        user_id: int,
        expire_days: int = 30
    ) -> Optional[ShareInfo]:
        try:
            itinerary = db.query(Itinerary).filter(
                Itinerary.id == itinerary_id,
                Itinerary.user_id == user_id
            ).first()
            
            if not itinerary:
                return None
            
            share_code = self.generate_share_code(itinerary_id, user_id)
            share_url = f"{self.base_url}/{share_code}"
            
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(share_url)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            qr_code = base64.b64encode(buffer.getvalue()).decode()
            
            expire_time = (datetime.now() + timedelta(days=expire_days)).strftime("%Y-%m-%d %H:%M:%S")
            
            self.share_cache[share_code] = {
                "itinerary_id": itinerary_id,
                "user_id": user_id,
                "expire_time": expire_time,
                "view_count": 0,
                "like_count": 0,
                "create_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return ShareInfo(
                share_code=share_code,
                share_url=share_url,
                qr_code=f"data:image/png;base64,{qr_code}",
                expire_time=expire_time,
                view_count=0,
                like_count=0
            )
            
        except Exception as e:
            logger.error(f"创建分享失败: {e}")
            return None
    
    def get_shared_itinerary(self, share_code: str, db: Session) -> Optional[SharedItinerary]:
        try:
            share_info = self.share_cache.get(share_code)
            
            if not share_info:
                return None
            
            expire_time = datetime.strptime(share_info["expire_time"], "%Y-%m-%d %H:%M:%S")
            if datetime.now() > expire_time:
                del self.share_cache[share_code]
                return None
            
            itinerary = db.query(Itinerary).filter(
                Itinerary.id == share_info["itinerary_id"]
            ).first()
            
            if not itinerary:
                return None
            
            user = db.query(User).filter(User.id == itinerary.user_id).first()
            
            self.share_cache[share_code]["view_count"] += 1
            
            return SharedItinerary(
                share_code=share_code,
                title=itinerary.title or f"{itinerary.destination}之旅",
                author=user.username if user else "匿名用户",
                days=itinerary.days or 3,
                cities=[itinerary.destination] if itinerary.destination else [],
                budget=float(itinerary.budget or 0),
                style=itinerary.style or "休闲型",
                highlights=["精彩景点", "特色美食", "文化体验"],
                content={
                    "schedules": [],
                    "notes": itinerary.notes or ""
                },
                view_count=self.share_cache[share_code]["view_count"],
                like_count=self.share_cache[share_code]["like_count"],
                create_time=share_info["create_time"]
            )
            
        except Exception as e:
            logger.error(f"获取分享行程失败: {e}")
            return None
    
    def like_shared_itinerary(self, share_code: str) -> bool:
        if share_code in self.share_cache:
            self.share_cache[share_code]["like_count"] += 1
            return True
        return False
    
    def get_popular_shares(self, limit: int = 10) -> List[Dict[str, Any]]:
        sorted_shares = sorted(
            self.share_cache.items(),
            key=lambda x: x[1]["view_count"],
            reverse=True
        )[:limit]
        
        return [
            {
                "share_code": code,
                "view_count": info["view_count"],
                "like_count": info["like_count"]
            }
            for code, info in sorted_shares
        ]
    
    def get_user_shares(self, user_id: int) -> List[Dict[str, Any]]:
        return [
            {
                "share_code": code,
                **info
            }
            for code, info in self.share_cache.items()
            if info["user_id"] == user_id
        ]


share_service = ShareService()
