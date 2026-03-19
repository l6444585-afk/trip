"""
API路由模块
"""
from fastapi import APIRouter
from . import attraction, ticket, ai, recommendation

api_router = APIRouter()

# 包含所有路由
api_router.include_router(attraction.router, prefix="/attractions", tags=["attractions"])
api_router.include_router(ticket.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(recommendation.router, prefix="/recommendation", tags=["recommendation"])