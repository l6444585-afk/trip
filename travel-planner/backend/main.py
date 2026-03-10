from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from database import get_db, init_db, init_enhanced_db, init_admin_db
from models import User, Itinerary, Schedule, Attraction, City
from schemas import (
    UserCreate, UserResponse, ItineraryCreate, ItineraryResponse,
    ScheduleCreate, ScheduleResponse, ItineraryDetailResponse,
    ChatRequest, ChatResponse, AttractionResponse, CityResponse
)
from glm_service import GLMService
from hybrid_ai_service import HybridItineraryService, IntentParser
from user_profile_service import (
    UserProfileService, ProfileAwareItineraryService,
    PreferenceCategory, UserPreference
)
from auth_utils import (
    UserLogin, UserRegister, Token, verify_password,
    get_password_hash, create_access_token, create_refresh_token,
    get_current_user, check_login_attempts, record_login_attempt,
    check_password_strength, validate_username_format, sanitize_input
)
from rule_routes import router as rule_router
from recommendation_routes import router as recommendation_router
from hotel_routes import router as hotel_router
from admin_routes import router as admin_router
from itinerary_service import ItineraryPlanningService
from data_importer import DataImporter, export_to_excel, create_template_excel
from restaurant_recommendation_service import RestaurantRecommendationService
from transport_connection_service import TransportConnectionService
from ai_travel_service import ai_travel_service
from fastapi.responses import StreamingResponse

load_dotenv()

def create_demo_user():
    from database import SessionLocal
    from auth_utils import get_password_hash
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.username == "admin").first()
        if not existing_user:
            hashed_password = get_password_hash("123456")
            demo_user = User(
                username="admin",
                email="admin@example.com",
                password=hashed_password
            )
            db.add(demo_user)
            db.commit()
            print("演示用户创建成功：admin / 123456")
        else:
            print("演示用户已存在")
    except Exception as e:
        print(f"创建演示用户失败：{str(e)}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_enhanced_db()
    init_admin_db()
    create_demo_user()
    from database import SessionLocal
    from admin_models import init_admin_data
    db = SessionLocal()
    try:
        init_admin_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="江浙沪旅游行程规划系统 API",
    description="基于 GLM-4.7 的智能旅游规划系统，集成规则引擎和量化计算服务",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rule_router)
app.include_router(recommendation_router)
app.include_router(hotel_router)
app.include_router(admin_router)

glm_service = GLMService()

@app.get("/")
async def root():
    return {
        "message": "江浙沪旅游行程规划系统 API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/ai/health")
async def ai_health_check():
    """
    检查AI服务（智谱API）的健康状态
    
    Returns:
        Dict: 包含API状态、延迟、可用性等信息
    """
    health_status = await glm_service.health_check()
    return health_status

@app.get("/api/ai/status")
async def ai_status():
    """
    获取AI服务状态（不执行实际API调用，使用缓存结果）
    
    Returns:
        Dict: AI服务状态摘要
    """
    return {
        "available": glm_service.is_available,
        "model": glm_service.model,
        "last_health_check": glm_service._last_health_check,
        "health_status": glm_service._health_status
    }

@app.post("/api/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    
    new_user = User(**user.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

@app.post("/api/itineraries/generate", response_model=dict)
async def generate_itinerary(
    itinerary: ItineraryCreate,
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    try:
        result = await glm_service.generate_itinerary(
            days=itinerary.days,
            budget=itinerary.budget,
            departure=itinerary.departure,
            companion_type=itinerary.companion_type,
            interests=itinerary.interests,
            destinations=itinerary.destinations,
            travel_style=itinerary.travel_style,
            travel_mode=itinerary.travel_mode,
            age_group=itinerary.age_group,
            pace_preference=itinerary.pace_preference,
            special_needs=itinerary.special_needs,
            date_range=itinerary.date_range
        )
        
        itinerary_data = result.get("itinerary", {})
        
        new_itinerary = Itinerary(
            user_id=user_id,
            title=itinerary_data.get("title", itinerary.title),
            days=itinerary.days,
            budget=itinerary.budget,
            departure=itinerary.departure,
            companion_type=itinerary.companion_type,
            interests=",".join(itinerary.interests)
        )
        
        db.add(new_itinerary)
        db.commit()
        db.refresh(new_itinerary)
        
        daily_plans = itinerary_data.get("daily_plans", [])
        for plan in daily_plans:
            day_num = plan.get("day", 1)
            
            for period in ["morning", "afternoon", "evening"]:
                period_data = plan.get(period)
                if period_data:
                    if isinstance(period_data, dict) and "activities" in period_data:
                        activities = period_data.get("activities", [])
                        if activities:
                            first_activity = activities[0]
                            schedule = Schedule(
                                itinerary_id=new_itinerary.id,
                                day=day_num,
                                period=period,
                                activity=first_activity.get("name", ""),
                                location=first_activity.get("location", ""),
                                latitude=first_activity.get("latitude"),
                                longitude=first_activity.get("longitude"),
                                notes=first_activity.get("tips", "")
                            )
                            db.add(schedule)
                    else:
                        schedule = Schedule(
                            itinerary_id=new_itinerary.id,
                            day=day_num,
                            period=period,
                            activity=period_data.get("activity", period_data.get("name", "")),
                            location=period_data.get("location", ""),
                            latitude=period_data.get("latitude"),
                            longitude=period_data.get("longitude"),
                            notes=period_data.get("tips", "")
                        )
                        db.add(schedule)
        
        db.commit()
        
        return {
            "itinerary_id": new_itinerary.id,
            "generated_itinerary": itinerary_data,
            "message": "行程生成成功"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"行程生成失败: {str(e)}")

@app.post("/api/itineraries/generate-multi", response_model=dict)
async def generate_multiple_itineraries(
    itinerary: ItineraryCreate,
    db: Session = Depends(get_db)
):
    try:
        result = await glm_service.generate_multiple_itineraries(
            days=itinerary.days,
            budget=itinerary.budget,
            departure=itinerary.departure,
            companion_type=itinerary.companion_type,
            interests=itinerary.interests,
            destinations=itinerary.destinations,
            travel_style=itinerary.travel_style,
            travel_mode=itinerary.travel_mode,
            age_group=itinerary.age_group,
            pace_preference=itinerary.pace_preference,
            special_needs=itinerary.special_needs,
            date_range=itinerary.date_range
        )
        
        return {
            "plans_comparison": result.get("plans_comparison", {}),
            "plans": result.get("plans", {}),
            "recommendation": result.get("recommendation", {}),
            "message": "多方案生成成功"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"多方案生成失败: {str(e)}")

@app.get("/api/itineraries/", response_model=List[ItineraryResponse])
async def get_itineraries(user_id: int = 1, db: Session = Depends(get_db)):
    itineraries = db.query(Itinerary).filter(Itinerary.user_id == user_id).all()
    return itineraries

@app.get("/api/itineraries/{itinerary_id}", response_model=ItineraryDetailResponse)
async def get_itinerary(itinerary_id: int, db: Session = Depends(get_db)):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="行程不存在")
    
    schedules = db.query(Schedule).filter(Schedule.itinerary_id == itinerary_id).all()
    
    itinerary_dict = {
        "id": itinerary.id,
        "user_id": itinerary.user_id,
        "title": itinerary.title,
        "days": itinerary.days,
        "budget": itinerary.budget,
        "departure": itinerary.departure,
        "companion_type": itinerary.companion_type,
        "interests": itinerary.interests,
        "created_at": itinerary.created_at,
        "updated_at": itinerary.updated_at,
        "schedules": schedules
    }
    
    return itinerary_dict

@app.put("/api/itineraries/{itinerary_id}", response_model=ItineraryResponse)
async def update_itinerary(
    itinerary_id: int,
    itinerary_update: ItineraryCreate,
    db: Session = Depends(get_db)
):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="行程不存在")
    
    itinerary.title = itinerary_update.title
    itinerary.days = itinerary_update.days
    itinerary.budget = itinerary_update.budget
    itinerary.departure = itinerary_update.departure
    itinerary.companion_type = itinerary_update.companion_type
    itinerary.interests = ",".join(itinerary_update.interests)
    
    db.commit()
    db.refresh(itinerary)
    return itinerary

@app.delete("/api/itineraries/{itinerary_id}")
async def delete_itinerary(itinerary_id: int, db: Session = Depends(get_db)):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="行程不存在")
    
    db.delete(itinerary)
    db.commit()
    return {"message": "行程删除成功"}

@app.put("/api/schedules/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    schedule_update: ScheduleCreate,
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="日程不存在")
    
    schedule.day = schedule_update.day
    schedule.period = schedule_update.period
    schedule.activity = schedule_update.activity
    schedule.location = schedule_update.location
    schedule.latitude = schedule_update.latitude
    schedule.longitude = schedule_update.longitude
    schedule.notes = schedule_update.notes
    
    db.commit()
    db.refresh(schedule)
    return schedule

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        context = ""
        if request.itinerary_id:
            itinerary = db.query(Itinerary).filter(Itinerary.id == request.itinerary_id).first()
            if itinerary:
                schedules = db.query(Schedule).filter(Schedule.itinerary_id == request.itinerary_id).all()
                context = f"行程标题：{itinerary.title}\n天数：{itinerary.days}天\n预算：{itinerary.budget}元\n"
                for s in schedules:
                    context += f"第{s.day}天{s.period}：{s.activity} - {s.location}\n"
        
        answer = await glm_service.chat_with_context(
            question=request.question,
            context=context,
            chat_history=request.chat_history
        )
        
        return ChatResponse(answer=answer)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"问答失败: {str(e)}")

@app.post("/api/auth/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="用户名已被使用")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=f"{user_data.username}@travel.local",
        password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.username})
    refresh_token = create_refresh_token(data={"sub": new_user.username})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 1800,
        "user": {
            "id": new_user.id,
            "username": new_user.username
        }
    }

@app.post("/api/auth/login", response_model=dict)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    can_login, remaining_minutes = check_login_attempts(user_credentials.username)
    if not can_login:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"登录尝试次数过多，请在 {remaining_minutes} 分钟后重试"
        )
    
    user = db.query(User).filter(User.username == user_credentials.username).first()
    if not user:
        record_login_attempt(user_credentials.username, False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    if not verify_password(user_credentials.password, user.password):
        record_login_attempt(user_credentials.username, False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    record_login_attempt(user_credentials.username, True)
    
    if user_credentials.remember_me:
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=timedelta(days=7)
        )
    else:
        access_token = create_access_token(data={"sub": user.username})
    
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 604800 if user_credentials.remember_me else 1800,
        "user": {
            "id": user.id,
            "username": user.username
        }
    }

@app.post("/api/auth/refresh", response_model=dict)
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    from auth_utils import verify_token
    payload = verify_token(refresh_token, "refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌"
        )
    
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在"
        )
    
    new_access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": 1800
    }

@app.post("/api/auth/check-username", response_model=dict)
async def check_username(username: str, db: Session = Depends(get_db)):
    is_valid, message = validate_username_format(username)
    if not is_valid:
        return {"available": False, "message": message}
    
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        return {"available": False, "message": "用户名已被使用"}
    
    return {"available": True, "message": "用户名可用"}

@app.post("/api/auth/check-password", response_model=dict)
async def check_password(password: str):
    result = check_password_strength(password)
    return {
        "is_valid": result.is_valid,
        "score": result.score,
        "message": result.message,
        "suggestions": result.suggestions
    }

@app.post("/api/auth/logout", response_model=dict)
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "登出成功"}

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/api/itineraries/{itinerary_id}/share", response_model=dict)
async def share_itinerary(
    itinerary_id: int,
    share_type: str = "link",
    permission: str = "public",
    custom_message: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        if not itinerary:
            raise HTTPException(status_code=404, detail="行程不存在")
        
        import uuid
        share_id = str(uuid.uuid4())
        share_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/shared/{share_id}"
        
        return {
            "share_id": share_id,
            "share_link": share_link,
            "share_type": share_type,
            "permission": permission,
            "custom_message": custom_message,
            "itinerary_title": itinerary.title,
            "message": "分享成功"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分享失败: {str(e)}")

@app.post("/api/itineraries/generate-hybrid", response_model=dict)
async def generate_itinerary_hybrid(
    user_input: str,
    start_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        hybrid_service = HybridItineraryService(db)
        
        parsed_start_date = None
        if start_date:
            try:
                parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d")
            except:
                parsed_start_date = None
        
        result = await hybrid_service.generate_itinerary_full(user_input, parsed_start_date)
        
        return {
            "success": True,
            "data": result,
            "message": "混合 AI 行程生成成功"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"行程生成失败: {str(e)}")

@app.post("/api/itineraries/parse-intent", response_model=dict)
async def parse_intent(user_input: str, db: Session = Depends(get_db)):
    try:
        hybrid_service = HybridItineraryService(db)
        intent = await hybrid_service.parse_user_intent(user_input)
        
        detected_intent = IntentParser.detect_intent(user_input)
        entities = IntentParser.extract_entities(user_input)
        
        return {
            "intent": intent,
            "detected_intent_type": detected_intent,
            "entities": entities,
            "message": "意图解析成功"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"意图解析失败: {str(e)}")

@app.post("/api/itineraries/{itinerary_id}/modify", response_model=dict)
async def modify_itinerary_hybrid(
    itinerary_id: int,
    modification_request: str,
    db: Session = Depends(get_db)
):
    try:
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        if not itinerary:
            raise HTTPException(status_code=404, detail="行程不存在")
        
        schedules = db.query(Schedule).filter(Schedule.itinerary_id == itinerary_id).all()
        
        original_data = {
            "id": itinerary.id,
            "title": itinerary.title,
            "days": itinerary.days,
            "schedules": [
                {
                    "day": s.day,
                    "period": s.period,
                    "activity": s.activity,
                    "location": s.location
                }
                for s in schedules
            ]
        }
        
        hybrid_service = HybridItineraryService(db)
        modified = await hybrid_service.modify_itinerary(original_data, modification_request)
        
        return {
            "success": True,
            "original": original_data,
            "modified": modified,
            "message": "行程修改成功"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"行程修改失败: {str(e)}")

@app.get("/api/attractions/", response_model=List[AttractionResponse])
async def get_attractions(
    city: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Attraction)
    
    if city:
        query = query.filter(Attraction.city == city)
    if category:
        query = query.filter(Attraction.category == category)
    
    attractions = query.order_by(Attraction.rating.desc()).limit(limit).all()
    return attractions

@app.get("/api/attractions/{attraction_id}", response_model=AttractionResponse)
async def get_attraction(attraction_id: int, db: Session = Depends(get_db)):
    attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attraction:
        raise HTTPException(status_code=404, detail="景点不存在")
    return attraction

@app.get("/api/cities/", response_model=List[CityResponse])
async def get_cities(db: Session = Depends(get_db)):
    cities = db.query(City).all()
    return cities

@app.get("/api/cities/{city_id}", response_model=CityResponse)
async def get_city(city_id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="城市不存在")
    return city

@app.get("/api/users/{user_id}/profile", response_model=dict)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    try:
        profile_service = UserProfileService(db)
        preferences = profile_service.get_user_preferences(user_id)
        constraints = profile_service.get_constraints_for_planning(user_id)
        context = profile_service.build_preference_context(user_id)
        
        return {
            "success": True,
            "user_id": user_id,
            "preferences": [p.to_dict() for p in preferences],
            "constraints": constraints,
            "context": context
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户画像失败: {str(e)}")

@app.post("/api/users/{user_id}/preferences/extract", response_model=dict)
async def extract_user_preferences(
    user_id: int,
    user_input: str,
    db: Session = Depends(get_db)
):
    try:
        profile_service = UserProfileService(db)
        preferences = await profile_service.extract_and_store(
            user_id, user_input, source="manual"
        )
        
        return {
            "success": True,
            "extracted_count": len(preferences),
            "preferences": [p.to_dict() for p in preferences],
            "message": f"成功提取 {len(preferences)} 个偏好"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"偏好提取失败: {str(e)}")

@app.get("/api/users/{user_id}/preferences", response_model=dict)
async def get_user_preferences(
    user_id: int,
    categories: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        profile_service = UserProfileService(db)
        
        category_list = categories.split(",") if categories else None
        preferences = profile_service.get_user_preferences(user_id, category_list)
        
        return {
            "success": True,
            "preferences": [p.to_dict() for p in preferences]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取偏好失败: {str(e)}")

@app.delete("/api/users/{user_id}/preferences/{preference_id}", response_model=dict)
async def delete_user_preference(
    user_id: int,
    preference_id: str,
    db: Session = Depends(get_db)
):
    try:
        profile_service = UserProfileService(db)
        success = profile_service.remove_preference(user_id, preference_id)
        
        if success:
            return {"success": True, "message": "偏好删除成功"}
        else:
            raise HTTPException(status_code=404, detail="偏好不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除偏好失败: {str(e)}")

@app.delete("/api/users/{user_id}/preferences", response_model=dict)
async def clear_user_preferences(user_id: int, db: Session = Depends(get_db)):
    try:
        profile_service = UserProfileService(db)
        count = profile_service.clear_user_profile(user_id)
        
        return {
            "success": True,
            "deleted_count": count,
            "message": f"已清除 {count} 个偏好"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"清除偏好失败: {str(e)}")

@app.get("/api/users/{user_id}/preferences/search", response_model=dict)
async def search_user_preferences(
    user_id: int,
    query: str,
    top_k: int = 5,
    db: Session = Depends(get_db)
):
    try:
        profile_service = UserProfileService(db)
        results = profile_service.search_relevant_preferences(user_id, query, top_k)
        
        return {
            "success": True,
            "query": query,
            "results": [
                {
                    "preference": pref.to_dict(),
                    "similarity": round(score, 3)
                }
                for pref, score in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索偏好失败: {str(e)}")

@app.get("/api/users/{user_id}/constraints", response_model=dict)
async def get_user_constraints(user_id: int, db: Session = Depends(get_db)):
    try:
        profile_service = UserProfileService(db)
        constraints = profile_service.get_constraints_for_planning(user_id)
        
        return {
            "success": True,
            "constraints": constraints
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取约束失败: {str(e)}")

@app.post("/api/users/{user_id}/profile/import", response_model=dict)
async def import_user_profile(
    user_id: int,
    profile_data: dict,
    db: Session = Depends(get_db)
):
    try:
        profile_service = UserProfileService(db)
        count = profile_service.import_profile(user_id, profile_data)
        
        return {
            "success": True,
            "imported_count": count,
            "message": f"成功导入 {count} 个偏好"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")

@app.get("/api/users/{user_id}/profile/export", response_model=dict)
async def export_user_profile(user_id: int, db: Session = Depends(get_db)):
    try:
        profile_service = UserProfileService(db)
        profile_data = profile_service.export_profile(user_id)
        
        return {
            "success": True,
            "profile": profile_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")

@app.post("/api/itineraries/generate-v2", response_model=dict)
async def generate_itinerary_v2(
    departure: str,
    destinations: str,
    days: int,
    budget: float,
    companion_type: str,
    interests: str,
    start_date: str,
    pace: str = "normal",
    travel_mode: str = "公共交通",
    age_group: str = "成年人",
    db: Session = Depends(get_db)
):
    try:
        planning_service = ItineraryPlanningService(db)
        
        dest_list = [d.strip() for d in destinations.split(",")]
        interest_list = [i.strip() for i in interests.split(",")]
        parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        
        result = await planning_service.generate_itinerary(
            departure=departure,
            destinations=dest_list,
            days=days,
            budget=budget,
            companion_type=companion_type,
            interests=interest_list,
            start_date=parsed_start_date,
            pace=pace,
            travel_mode=travel_mode,
            age_group=age_group
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"行程生成失败: {str(e)}")

@app.post("/api/itineraries/generate-with-profile", response_model=dict)
async def generate_itinerary_with_profile(
    user_id: int,
    user_input: str,
    departure: str,
    destinations: str,
    days: int,
    budget: float,
    start_date: str,
    db: Session = Depends(get_db)
):
    try:
        profile_service = UserProfileService(db)
        planning_service = ItineraryPlanningService(db)
        
        extracted_prefs = await profile_service.extract_and_store(
            user_id, user_input, source="planning"
        )
        
        constraints = profile_service.get_constraints_for_planning(user_id)
        
        dest_list = [d.strip() for d in destinations.split(",")]
        parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        
        companion_type = constraints.get("companion_type") or "couple"
        pace = constraints.get("pace_preference") or "normal"
        interests = constraints.get("interests") or []
        age_group = "成年人"
        
        if constraints.get("mobility_constraints"):
            if any("老人" in c for c in constraints["mobility_constraints"]):
                age_group = "老年人"
        
        result = await planning_service.generate_itinerary(
            departure=departure,
            destinations=dest_list,
            days=days,
            budget=budget,
            companion_type=companion_type,
            interests=interests,
            start_date=parsed_start_date,
            pace=pace,
            age_group=age_group
        )
        
        if result.get("success") and result.get("itinerary"):
            preference_context = profile_service.build_preference_context(user_id)
            result["itinerary"]["user_profile"] = {
                "extracted_preferences": [p.to_dict() for p in extracted_prefs],
                "constraints": constraints,
                "preference_context": preference_context
            }
            
            if constraints.get("dietary_restrictions"):
                if "risk_alerts" not in result["itinerary"]:
                    result["itinerary"]["risk_alerts"] = {}
                result["itinerary"]["risk_alerts"]["dietary"] = constraints["dietary_restrictions"]
            
            if constraints.get("mobility_constraints"):
                if "risk_alerts" not in result["itinerary"]:
                    result["itinerary"]["risk_alerts"] = {}
                result["itinerary"]["risk_alerts"]["mobility"] = constraints["mobility_constraints"]
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"行程生成失败: {str(e)}")

@app.post("/api/itineraries/generate-multi-v2", response_model=dict)
async def generate_multiple_itineraries_v2(
    departure: str,
    destinations: str,
    days: int,
    budget: float,
    companion_type: str,
    interests: str,
    start_date: str,
    db: Session = Depends(get_db)
):
    try:
        planning_service = ItineraryPlanningService(db)
        
        dest_list = [d.strip() for d in destinations.split(",")]
        interest_list = [i.strip() for i in interests.split(",")]
        parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        
        result = await planning_service.generate_multiple_itineraries(
            departure=departure,
            destinations=dest_list,
            days=days,
            budget=budget,
            companion_type=companion_type,
            interests=interest_list,
            start_date=parsed_start_date
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"多方案生成失败: {str(e)}")

@app.post("/api/itineraries/enhance", response_model=dict)
async def enhance_itinerary_content(
    itinerary_data: dict,
    user_input: str,
    db: Session = Depends(get_db)
):
    try:
        planning_service = ItineraryPlanningService(db)
        enhanced = await planning_service.enhance_content(itinerary_data, user_input)
        return {"success": True, "itinerary": enhanced}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"内容润色失败: {str(e)}")

@app.post("/api/data/import/excel", response_model=dict)
async def import_data_from_excel(
    file_path: str,
    db: Session = Depends(get_db)
):
    try:
        importer = DataImporter(db)
        result = importer.import_from_excel(file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据导入失败: {str(e)}")

@app.post("/api/data/import/csv", response_model=dict)
async def import_data_from_csv(
    directory: str,
    db: Session = Depends(get_db)
):
    try:
        importer = DataImporter(db)
        result = importer.import_from_csv(directory)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据导入失败: {str(e)}")

@app.get("/api/data/export/excel", response_model=dict)
async def export_data_to_excel(
    output_path: str = "data_export.xlsx",
    db: Session = Depends(get_db)
):
    try:
        result = export_to_excel(db, output_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据导出失败: {str(e)}")

@app.get("/api/data/template", response_model=dict)
async def create_data_template(
    output_path: str = "data_template.xlsx"
):
    try:
        result = create_template_excel(output_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"模板创建失败: {str(e)}")

@app.get("/api/feasibility/check", response_model=dict)
async def check_feasibility(
    attraction_ids: str,
    days: int,
    budget: float,
    age_group: str = "成年人",
    companion_type: str = "朋友",
    db: Session = Depends(get_db)
):
    try:
        planning_service = ItineraryPlanningService(db)
        
        ids = [int(id.strip()) for id in attraction_ids.split(",")]
        attractions = db.query(Attraction).filter(Attraction.id.in_(ids)).all()
        
        result = planning_service.check_feasibility(
            attractions, days, budget, age_group, companion_type
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"可行性检查失败: {str(e)}")


# ==================== 餐饮推荐API ====================

@app.get("/api/restaurants/nearby", response_model=dict)
async def get_nearby_restaurants(
    latitude: float,
    longitude: float,
    radius_km: float = 1.0,
    city: Optional[str] = None,
    cuisine_type: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    try:
        from enhanced_models import Restaurant
        service = RestaurantRecommendationService(db)
        results = service.search_nearby(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            city=city,
            cuisine_type=cuisine_type,
            limit=limit
        )
        
        return {
            "success": True,
            "center": {"latitude": latitude, "longitude": longitude},
            "radius_km": radius_km,
            "count": len(results),
            "restaurants": [
                {
                    "id": r.id,
                    "name": r.name,
                    "city": r.city,
                    "address": r.address,
                    "cuisine_type": r.cuisine_type,
                    "price_level": r.price_level,
                    "avg_cost_per_person": r.avg_cost_per_person,
                    "rating": r.rating,
                    "distance_km": round(d, 2)
                }
                for r, d in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索餐厅失败: {str(e)}")


@app.get("/api/restaurants/recommend", response_model=dict)
async def recommend_restaurants(
    latitude: float,
    longitude: float,
    user_id: Optional[int] = None,
    radius_km: float = 1.0,
    meal_type: str = "lunch",
    budget_level: str = "medium",
    limit: int = 5,
    db: Session = Depends(get_db)
):
    try:
        profile_service = UserProfileService(db) if user_id else None
        service = RestaurantRecommendationService(db, profile_service)
        
        recommendations = service.recommend_for_location(
            latitude=latitude,
            longitude=longitude,
            user_id=user_id,
            radius_km=radius_km,
            meal_type=meal_type,
            budget_level=budget_level,
            limit=limit
        )
        
        return {
            "success": True,
            "count": len(recommendations),
            "recommendations": [r.to_dict() for r in recommendations]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"推荐失败: {str(e)}")


@app.get("/api/restaurants/recommend-for-attraction/{attraction_id}", response_model=dict)
async def recommend_restaurants_for_attraction(
    attraction_id: int,
    user_id: Optional[int] = None,
    meal_type: str = "lunch",
    budget_level: str = "medium",
    limit: int = 5,
    db: Session = Depends(get_db)
):
    try:
        attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
        if not attraction:
            raise HTTPException(status_code=404, detail="景点不存在")
        
        profile_service = UserProfileService(db) if user_id else None
        service = RestaurantRecommendationService(db, profile_service)
        
        recommendations = service.recommend_for_attraction(
            attraction=attraction,
            user_id=user_id,
            meal_type=meal_type,
            budget_level=budget_level,
            limit=limit
        )
        
        return {
            "success": True,
            "attraction": {
                "id": attraction.id,
                "name": attraction.name,
                "latitude": attraction.latitude,
                "longitude": attraction.longitude
            },
            "count": len(recommendations),
            "recommendations": [r.to_dict() for r in recommendations]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"推荐失败: {str(e)}")


@app.get("/api/restaurants/by-city/{city}", response_model=dict)
async def get_restaurants_by_city(
    city: str,
    user_id: Optional[int] = None,
    cuisine_type: Optional[str] = None,
    price_level: Optional[int] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    try:
        profile_service = UserProfileService(db) if user_id else None
        service = RestaurantRecommendationService(db, profile_service)
        
        recommendations = service.recommend_by_city(
            city=city,
            user_id=user_id,
            cuisine_type=cuisine_type,
            price_level=price_level,
            limit=limit
        )
        
        return {
            "success": True,
            "city": city,
            "count": len(recommendations),
            "restaurants": [r.to_dict() for r in recommendations]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取餐厅失败: {str(e)}")


@app.get("/api/restaurants/{restaurant_id}", response_model=dict)
async def get_restaurant_detail(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    try:
        service = RestaurantRecommendationService(db)
        detail = service.get_restaurant_detail(restaurant_id)
        
        if not detail:
            raise HTTPException(status_code=404, detail="餐厅不存在")
        
        return {
            "success": True,
            "restaurant": detail
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取餐厅详情失败: {str(e)}")


@app.get("/api/restaurants/{restaurant_id}/open-status", response_model=dict)
async def check_restaurant_open_status(
    restaurant_id: int,
    check_time: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        from enhanced_models import Restaurant
        
        restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
        if not restaurant:
            raise HTTPException(status_code=404, detail="餐厅不存在")
        
        service = RestaurantRecommendationService(db)
        
        check_dt = None
        if check_time:
            try:
                check_dt = datetime.strptime(check_time, "%Y-%m-%d %H:%M")
            except:
                check_dt = datetime.strptime(check_time, "%H:%M")
                check_dt = datetime.now().replace(
                    hour=check_dt.hour, minute=check_dt.minute
                )
        
        status = service.check_restaurant_open(restaurant, check_dt)
        
        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "restaurant_name": restaurant.name,
            **status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检查营业状态失败: {str(e)}")


@app.post("/api/restaurants/meal-plan", response_model=dict)
async def get_meal_plan_for_itinerary(
    attraction_ids: str,
    user_id: Optional[int] = None,
    budget_level: str = "medium",
    db: Session = Depends(get_db)
):
    try:
        ids = [int(id.strip()) for id in attraction_ids.split(",")]
        attractions = db.query(Attraction).filter(Attraction.id.in_(ids)).all()
        
        if not attractions:
            return {
                "success": True,
                "lunch": [],
                "dinner": []
            }
        
        profile_service = UserProfileService(db) if user_id else None
        service = RestaurantRecommendationService(db, profile_service)
        
        meal_recommendations = service.get_meal_recommendations_for_itinerary(
            attractions=attractions,
            user_id=user_id,
            budget_level=budget_level
        )
        
        return {
            "success": True,
            "lunch": [r.to_dict() for r in meal_recommendations.get("lunch", [])],
            "dinner": [r.to_dict() for r in meal_recommendations.get("dinner", [])]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取餐饮计划失败: {str(e)}")


# ==================== 交通接驳API ====================

@app.get("/api/transport/hubs/{city}", response_model=dict)
async def get_city_transport_hubs(
    city: str,
    db: Session = Depends(get_db)
):
    try:
        service = TransportConnectionService(db)
        hubs = service.get_city_hubs(city)
        
        return {
            "success": True,
            "city": city,
            "hubs": hubs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取交通枢纽失败: {str(e)}")


@app.get("/api/transport/main-hub/{city}", response_model=dict)
async def get_city_main_hub(
    city: str,
    db: Session = Depends(get_db)
):
    try:
        service = TransportConnectionService(db)
        hub = service.get_main_hub(city)
        
        return {
            "success": True,
            "city": city,
            "main_hub": hub
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取主枢纽失败: {str(e)}")


@app.get("/api/transport/inter-city", response_model=dict)
async def get_inter_city_transport(
    from_city: str,
    to_city: str,
    db: Session = Depends(get_db)
):
    try:
        service = TransportConnectionService(db)
        transport = service.get_inter_city_transport(from_city, to_city)
        
        if not transport:
            return {
                "success": False,
                "message": f"未找到 {from_city} → {to_city} 的交通信息"
            }
        
        return {
            "success": True,
            "from_city": from_city,
            "to_city": to_city,
            "transport": transport
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取交通信息失败: {str(e)}")


@app.get("/api/transport/plan", response_model=dict)
async def plan_transport_connection(
    from_city: str,
    to_city: str,
    attraction_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    try:
        service = TransportConnectionService(db)
        
        destination_attraction = None
        if attraction_id:
            destination_attraction = db.query(Attraction).filter(
                Attraction.id == attraction_id
            ).first()
        
        plan = service.plan_connection(from_city, to_city, destination_attraction)
        
        return {
            "success": True,
            "plan": plan.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"规划交通失败: {str(e)}")


@app.get("/api/transport/multi-city", response_model=dict)
async def plan_multi_city_transport(
    cities: str,
    attraction_ids: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        service = TransportConnectionService(db)
        
        city_list = [c.strip() for c in cities.split(",")]
        
        attractions = None
        if attraction_ids:
            ids = [int(id.strip()) for id in attraction_ids.split(",")]
            attractions = db.query(Attraction).filter(Attraction.id.in_(ids)).all()
        
        summary = service.get_transport_summary(city_list)
        
        return {
            "success": True,
            **summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"规划多城市交通失败: {str(e)}")


@app.get("/api/transport/routes", response_model=dict)
async def get_all_transport_routes(db: Session = Depends(get_db)):
    try:
        service = TransportConnectionService(db)
        routes = service.get_all_inter_city_routes()
        
        return {
            "success": True,
            "count": len(routes),
            "routes": routes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取路线失败: {str(e)}")


@app.get("/api/transport/departure-time", response_model=dict)
async def recommend_departure_time(
    from_city: str,
    to_city: str,
    arrival_time: str = "09:00",
    attraction_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    try:
        service = TransportConnectionService(db)
        
        destination_attraction = None
        if attraction_id:
            destination_attraction = db.query(Attraction).filter(
                Attraction.id == attraction_id
            ).first()
        
        plan = service.plan_connection(from_city, to_city, destination_attraction)
        recommendation = service.recommend_departure_time(plan, arrival_time)
        
        return {
            "success": True,
            "from_city": from_city,
            "to_city": to_city,
            "plan": plan.to_dict(),
            **recommendation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"计算出发时间失败: {str(e)}")


@app.get("/api/transport/last-mile", response_model=dict)
async def estimate_last_mile_transport(
    hub_name: str,
    hub_city: str,
    attraction_id: int,
    db: Session = Depends(get_db)
):
    try:
        attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
        if not attraction:
            raise HTTPException(status_code=404, detail="景点不存在")
        
        service = TransportConnectionService(db)
        hubs = service.get_city_hubs(hub_city)
        
        hub = None
        for h in hubs:
            if h.get("name") == hub_name:
                hub = h
                break
        
        if not hub:
            hub = hubs[0] if hubs else {"name": hub_name, "latitude": None, "longitude": None}
        
        segment = service.estimate_last_mile(hub, attraction)
        
        return {
            "success": True,
            "hub": hub,
            "attraction": {
                "id": attraction.id,
                "name": attraction.name,
                "latitude": attraction.latitude,
                "longitude": attraction.longitude
            },
            "last_mile": segment.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"计算最后一公里失败: {str(e)}")


# ==================== AI智能规划API ====================

@app.post("/api/ai-travel/chat", response_model=dict)
async def ai_travel_chat(request: dict):
    try:
        user_id = request.get("user_id", "default_user")
        message = request.get("message", "")
        stream = request.get("stream", False)
        
        if not message:
            raise HTTPException(status_code=400, detail="消息不能为空")
        
        if stream:
            result = await ai_travel_service.chat(user_id, message, stream=True)
            return StreamingResponse(
                result,
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        else:
            result = await ai_travel_service.chat(user_id, message, stream=False)
            return {
                "success": True,
                "reply": result.get("content", ""),
                "context": result.get("context", {}),
                "usage": result.get("usage")
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI对话失败: {str(e)}")


@app.get("/api/ai-travel/history/{user_id}", response_model=dict)
async def get_ai_travel_history(user_id: str):
    try:
        history = ai_travel_service.get_history(user_id)
        context = ai_travel_service.get_context(user_id)
        return {
            "success": True,
            "history": history,
            "context": context
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取历史失败: {str(e)}")


@app.delete("/api/ai-travel/session/{user_id}", response_model=dict)
async def clear_ai_travel_session(user_id: str):
    try:
        ai_travel_service.clear_session(user_id)
        return {
            "success": True,
            "message": "会话已清除"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"清除会话失败: {str(e)}")


@app.post("/api/ai-travel/generate", response_model=dict)
async def ai_travel_generate(request: dict):
    try:
        user_id = request.get("user_id", "default_user")
        departure = request.get("departure", "")
        destination = request.get("destination", "")
        days = request.get("days", 3)
        budget = request.get("budget", 2000)
        companion_type = request.get("companion_type", "朋友")
        interests = request.get("interests", [])
        travel_mode = request.get("travel_mode", "公共交通")
        pace = request.get("pace", "适中")
        
        result = await ai_travel_service.generate_itinerary(
            user_id=user_id,
            departure=departure,
            destination=destination,
            days=days,
            budget=budget,
            companion_type=companion_type,
            interests=interests,
            travel_mode=travel_mode,
            pace=pace
        )
        
        return {
            "success": True,
            "itinerary": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成行程失败: {str(e)}")


@app.get("/api/ai-travel/context/{user_id}", response_model=dict)
async def get_ai_travel_context(user_id: str):
    try:
        context = ai_travel_service.get_context(user_id)
        return {
            "success": True,
            "context": context
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取上下文失败: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
