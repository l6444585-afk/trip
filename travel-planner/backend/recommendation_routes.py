from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from recommendation_engine import recommendation_engine
from database import get_db
from response_utils import ApiResponse
from logger_config import logger
from pydantic import BaseModel

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

class RecommendationRequest(BaseModel):
    interests: List[str]
    companion_type: str
    budget: float
    days: int
    departure: Optional[str] = None
    current_season: str = "春"
    limit: int = 10

@router.post("/attractions", response_model=ApiResponse)
async def recommend_attractions(
    request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Generating recommendations for {request.departure}")
        
        recommendations = recommendation_engine.recommend_attractions(
            user_interests=request.interests,
            companion_type=request.companion_type,
            budget=request.budget,
            days=request.days,
            departure=request.departure,
            current_season=request.current_season,
            limit=request.limit
        )
        
        return ApiResponse.success(
            message="推荐生成成功",
            data={
                "attractions": recommendations,
                "total": len(recommendations)
            }
        )
        
    except Exception as e:
        logger.error(f"Recommendation generation failed: {str(e)}")
        return ApiResponse.error(
            message=f"推荐生成失败: {str(e)}"
        )

@router.get("/tags", response_model=ApiResponse)
async def get_special_tags():
    try:
        tags = recommendation_engine.get_special_tags()
        
        return ApiResponse.success(
            message="获取特色标签成功",
            data={"tags": tags}
        )
        
    except Exception as e:
        logger.error(f"Failed to get special tags: {str(e)}")
        return ApiResponse.error(
            message=f"获取特色标签失败: {str(e)}"
        )

@router.get("/destinations", response_model=ApiResponse)
async def get_destinations():
    try:
        destinations = [
            {
                "name": "杭州",
                "highlight": "西湖十景",
                "icon": "🏞️",
                "color": "#2E8B57",
                "description": "人间天堂，西湖美景"
            },
            {
                "name": "苏州",
                "highlight": "园林艺术",
                "icon": "🏛️",
                "color": "#4A90A4",
                "description": "江南园林，古典之美"
            },
            {
                "name": "上海",
                "highlight": "都市风情",
                "icon": "🌆",
                "color": "#607D8B",
                "description": "魔都上海，现代繁华"
            },
            {
                "name": "南京",
                "highlight": "历史底蕴",
                "icon": "🏯",
                "color": "#E8B86D",
                "description": "六朝古都，历史厚重"
            },
            {
                "name": "无锡",
                "highlight": "太湖风光",
                "icon": "🌊",
                "color": "#4CAF50",
                "description": "太湖明珠，山水之城"
            },
            {
                "name": "宁波",
                "highlight": "海港文化",
                "icon": "⚓",
                "color": "#64B5F6",
                "description": "海定波宁，港口之城"
            }
        ]
        
        return ApiResponse.success(
            message="获取目的地成功",
            data={"destinations": destinations}
        )
        
    except Exception as e:
        logger.error(f"Failed to get destinations: {str(e)}")
        return ApiResponse.error(
            message=f"获取目的地失败: {str(e)}"
        )
