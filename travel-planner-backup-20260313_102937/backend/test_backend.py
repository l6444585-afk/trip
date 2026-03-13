import pytest
import asyncio
from httpx import AsyncClient
from main import app
from recommendation_engine import recommendation_engine

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_generate_itinerary():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        payload = {
            "title": "杭州三日游",
            "days": 3,
            "budget": 3000,
            "departure": "杭州",
            "companion_type": "情侣",
            "interests": ["美食", "人文历史"]
        }
        response = await ac.post("/api/itineraries/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "itinerary_id" in data

@pytest.mark.asyncio
async def test_get_itineraries():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/itineraries/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

@pytest.mark.asyncio
async def test_recommendations():
    payload = {
        "interests": ["美食", "人文历史"],
        "companion_type": "情侣",
        "budget": 3000,
        "days": 3,
        "departure": "杭州",
        "current_season": "春",
        "limit": 5
    }
    
    recommendations = recommendation_engine.recommend_attractions(
        user_interests=payload["interests"],
        companion_type=payload["companion_type"],
        budget=payload["budget"],
        days=payload["days"],
        departure=payload["departure"],
        current_season=payload["current_season"],
        limit=payload["limit"]
    )
    
    assert len(recommendations) > 0
    assert all("recommendation_score" in r for r in recommendations)

@pytest.mark.asyncio
async def test_special_tags():
    tags = recommendation_engine.get_special_tags()
    assert len(tags) > 0
    assert all("tag" in t and "description" in t for t in tags)

def test_interest_match_score():
    engine = recommendation_engine
    score = engine.calculate_interest_match_score(
        user_interests=["美食", "人文历史"],
        attraction_tags=["历史文化", "美食打卡"]
    )
    assert 0 <= score <= 1

def test_companion_score():
    engine = recommendation_engine
    score = engine.calculate_companion_score(
        companion_type="情侣",
        attraction={"tags": ["网红地标", "小众秘境"]}
    )
    assert 0 <= score <= 1

def test_budget_score():
    engine = recommendation_engine
    score = engine.calculate_budget_score(
        user_budget=3000,
        attraction_cost=100,
        days=3
    )
    assert 0 <= score <= 1

def test_season_score():
    engine = recommendation_engine
    score = engine.calculate_season_score(
        current_season="春",
        attraction_best_seasons=["春", "秋"]
    )
    assert score == 1.0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
