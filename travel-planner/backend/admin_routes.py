from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, and_
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import json
import os

from database import get_db
from models import User, Itinerary, Schedule, Attraction, City
from admin_models import (
    AdminUser, Role, Permission, Order, OperationLog, 
    SystemConfig, DataBackup, SystemMetric, OnlineUser,
    Announcement, Feedback, ItineraryReview, AttractionMedia,
    init_admin_data
)
from admin_schemas import (
    AdminUserCreate, AdminUserUpdate, AdminUserResponse,
    RoleCreate, RoleUpdate, RoleResponse,
    PermissionCreate, PermissionUpdate, PermissionResponse,
    OrderCreate, OrderUpdate, OrderResponse,
    OperationLogResponse, UserListResponse, UserDetailResponse,
    ItineraryAdminResponse, AttractionAdminResponse,
    DashboardStats, RevenueTrend, PopularItinerary, UserActivityTrend,
    PaginatedResponse, AdminLogin, AdminToken,
    SystemConfigUpdate, BackupCreate, AnnouncementCreate, 
    AnnouncementUpdate, FeedbackResponse, FeedbackReply,
    ItineraryReviewCreate, AttractionMediaCreate, DataExportRequest
)
from auth_utils import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, verify_token
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login")

async def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token, "access")
    if payload is None:
        raise credentials_exception
    
    username = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    admin = db.query(AdminUser).filter(AdminUser.username == username).first()
    if admin is None:
        raise credentials_exception
    
    if admin.status != 1:
        raise HTTPException(status_code=403, detail="账户已被禁用")
    
    return admin

async def check_permission(admin: AdminUser, permission_code: str, db: Session):
    if admin.is_superuser:
        return True
    
    for role in admin.roles:
        for perm in role.permissions:
            if perm.code == permission_code:
                return True
    
    return False

def require_permission(permission_code: str):
    async def permission_checker(
        admin: AdminUser = Depends(get_current_admin),
        db: Session = Depends(get_db)
    ):
        has_perm = await check_permission(admin, permission_code, db)
        if not has_perm:
            raise HTTPException(status_code=403, detail="没有操作权限")
        return admin
    return permission_checker

async def log_operation(
    db: Session,
    admin: AdminUser,
    request: Request,
    module: str,
    action: str,
    target_type: str = None,
    target_id: int = None,
    target_name: str = None,
    description: str = None,
    status: int = 1,
    error_msg: str = None,
    duration_ms: int = None
):
    log = OperationLog(
        operator_id=admin.id,
        operator_name=admin.username,
        operator_ip=request.client.host if request.client else None,
        module=module,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_name=target_name,
        description=description,
        request_method=request.method,
        request_url=str(request.url),
        status=status,
        error_msg=error_msg,
        duration_ms=duration_ms
    )
    db.add(log)
    db.commit()

@router.post("/login", response_model=AdminToken)
async def admin_login(
    login_data: AdminLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    admin = db.query(AdminUser).filter(AdminUser.username == login_data.username).first()
    if not admin:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    if not verify_password(login_data.password, admin.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    if admin.status != 1:
        raise HTTPException(status_code=403, detail="账户已被禁用")
    
    admin.last_login = datetime.utcnow()
    admin.last_login_ip = request.client.host if request.client else None
    db.commit()
    
    access_token = create_access_token(
        data={"sub": admin.username, "type": "admin"},
        expires_delta=timedelta(hours=2)
    )
    refresh_token = create_refresh_token(data={"sub": admin.username, "type": "admin"})
    
    roles = [{"id": r.id, "name": r.name, "code": r.code} for r in admin.roles]
    permissions = []
    for role in admin.roles:
        for perm in role.permissions:
            if perm.code not in permissions:
                permissions.append(perm.code)
    
    return AdminToken(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": admin.id,
            "username": admin.username,
            "email": admin.email,
            "real_name": admin.real_name,
            "avatar": admin.avatar,
            "is_superuser": admin.is_superuser,
            "roles": roles,
            "permissions": permissions
        }
    )

@router.get("/me", response_model=AdminUserResponse)
async def get_admin_info(admin: AdminUser = Depends(get_current_admin)):
    roles = [{"id": r.id, "name": r.name, "code": r.code} for r in admin.roles]
    return AdminUserResponse(
        id=admin.id,
        username=admin.username,
        email=admin.email,
        real_name=admin.real_name,
        phone=admin.phone,
        avatar=admin.avatar,
        status=admin.status,
        is_superuser=admin.is_superuser,
        last_login=admin.last_login,
        last_login_ip=admin.last_login_ip,
        created_at=admin.created_at,
        roles=roles
    )

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    total_users = db.query(func.count(User.id)).scalar()
    new_users_today = db.query(func.count(User.id)).filter(
        func.date(User.created_at) == today
    ).scalar()
    new_users_week = db.query(func.count(User.id)).filter(
        User.created_at >= week_ago
    ).scalar()
    new_users_month = db.query(func.count(User.id)).filter(
        User.created_at >= month_ago
    ).scalar()
    
    active_users_today = db.query(func.count(func.distinct(OnlineUser.user_id))).filter(
        func.date(OnlineUser.last_activity) == today,
        OnlineUser.user_type == 'user'
    ).scalar() or 0
    
    total_itineraries = db.query(func.count(Itinerary.id)).scalar()
    new_itineraries_today = db.query(func.count(Itinerary.id)).filter(
        func.date(Itinerary.created_at) == today
    ).scalar()
    published_itineraries = db.query(func.count(Itinerary.id)).filter(
        Itinerary.id.in_(
            db.query(ItineraryReview.itinerary_id).filter(
                ItineraryReview.status == 'approved'
            )
        )
    ).scalar() or 0
    pending_review = db.query(func.count(Itinerary.id)).filter(
        Itinerary.id.in_(
            db.query(ItineraryReview.itinerary_id).filter(
                ItineraryReview.status == 'pending'
            )
        )
    ).scalar() or 0
    
    total_orders = db.query(func.count(Order.id)).scalar()
    today_orders = db.query(func.count(Order.id)).filter(
        func.date(Order.created_at) == today
    ).scalar()
    today_revenue = db.query(func.sum(Order.paid_amount)).filter(
        func.date(Order.created_at) == today,
        Order.payment_status == 'paid'
    ).scalar() or 0
    month_revenue = db.query(func.sum(Order.paid_amount)).filter(
        Order.created_at >= month_ago,
        Order.payment_status == 'paid'
    ).scalar() or 0
    total_revenue = db.query(func.sum(Order.paid_amount)).filter(
        Order.payment_status == 'paid'
    ).scalar() or 0
    
    total_attractions = db.query(func.count(Attraction.id)).scalar()
    total_cities = db.query(func.count(City.id)).scalar()
    
    return DashboardStats(
        total_users=total_users or 0,
        new_users_today=new_users_today or 0,
        new_users_week=new_users_week or 0,
        new_users_month=new_users_month or 0,
        active_users_today=active_users_today,
        total_itineraries=total_itineraries or 0,
        new_itineraries_today=new_itineraries_today or 0,
        published_itineraries=published_itineraries,
        pending_review=pending_review,
        total_orders=total_orders or 0,
        today_orders=today_orders or 0,
        today_revenue=today_revenue,
        month_revenue=month_revenue,
        total_revenue=total_revenue,
        total_attractions=total_attractions or 0,
        total_cities=total_cities or 0
    )

@router.get("/dashboard/revenue-trend", response_model=List[RevenueTrend])
async def get_revenue_trend(
    days: int = Query(30, ge=7, le=90),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    result = []
    today = datetime.utcnow().date()
    
    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        revenue = db.query(func.sum(Order.paid_amount)).filter(
            func.date(Order.created_at) == date,
            Order.payment_status == 'paid'
        ).scalar() or 0
        
        orders = db.query(func.count(Order.id)).filter(
            func.date(Order.created_at) == date
        ).scalar() or 0
        
        result.append(RevenueTrend(
            date=date.strftime("%Y-%m-%d"),
            revenue=revenue,
            orders=orders
        ))
    
    return result

@router.get("/dashboard/user-activity", response_model=List[UserActivityTrend])
async def get_user_activity_trend(
    days: int = Query(30, ge=7, le=90),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    result = []
    today = datetime.utcnow().date()
    
    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        new_users = db.query(func.count(User.id)).filter(
            func.date(User.created_at) == date
        ).scalar() or 0
        
        active_users = db.query(func.count(func.distinct(OnlineUser.user_id))).filter(
            func.date(OnlineUser.last_activity) == date,
            OnlineUser.user_type == 'user'
        ).scalar() or 0
        
        logins = db.query(func.count(OperationLog.id)).filter(
            func.date(OperationLog.created_at) == date,
            OperationLog.action == 'login'
        ).scalar() or 0
        
        result.append(UserActivityTrend(
            date=date.strftime("%Y-%m-%d"),
            new_users=new_users,
            active_users=active_users,
            logins=logins
        ))
    
    return result

@router.get("/dashboard/popular-itineraries", response_model=List[PopularItinerary])
async def get_popular_itineraries(
    limit: int = Query(10, ge=5, le=50),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    itineraries = db.query(Itinerary).order_by(desc(Itinerary.created_at)).limit(limit).all()
    
    result = []
    for it in itineraries:
        view_count = db.query(func.count(OperationLog.id)).filter(
            OperationLog.target_type == 'itinerary',
            OperationLog.target_id == it.id,
            OperationLog.action == 'view'
        ).scalar() or 0
        
        order_count = db.query(func.count(Order.id)).filter(
            Order.itinerary_id == it.id
        ).scalar() or 0
        
        revenue = db.query(func.sum(Order.paid_amount)).filter(
            Order.itinerary_id == it.id,
            Order.payment_status == 'paid'
        ).scalar() or 0
        
        result.append(PopularItinerary(
            id=it.id,
            title=it.title,
            view_count=view_count,
            order_count=order_count,
            revenue=revenue
        ))
    
    return sorted(result, key=lambda x: x.order_count, reverse=True)

@router.get("/users", response_model=PaginatedResponse)
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: AdminUser = Depends(require_permission("user:list")),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    
    if keyword:
        query = query.filter(
            or_(
                User.username.contains(keyword),
                User.email.contains(keyword)
            )
        )
    
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(User.created_at >= start)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        query = query.filter(User.created_at < end)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    
    users = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for user in users:
        itineraries_count = db.query(func.count(Itinerary.id)).filter(
            Itinerary.user_id == user.id
        ).scalar() or 0
        
        orders_count = db.query(func.count(Order.id)).filter(
            Order.user_id == user.id
        ).scalar() or 0
        
        items.append(UserListResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at,
            itineraries_count=itineraries_count,
            orders_count=orders_count
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: int,
    admin: AdminUser = Depends(require_permission("user:list")),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    itineraries_count = db.query(func.count(Itinerary.id)).filter(
        Itinerary.user_id == user.id
    ).scalar() or 0
    
    orders_count = db.query(func.count(Order.id)).filter(
        Order.user_id == user.id
    ).scalar() or 0
    
    preferences = None
    if user.preferences:
        preferences = {
            "favorite_destinations": user.preferences.favorite_destinations,
            "disliked_destinations": user.preferences.disliked_destinations,
            "dietary_restrictions": user.preferences.dietary_restrictions,
            "mobility_constraints": user.preferences.mobility_constraints,
            "preferred_pace": user.preferences.preferred_pace,
            "budget_preference": user.preferences.budget_preference,
            "interests": user.preferences.interests
        }
    
    recent_itineraries = db.query(Itinerary).filter(
        Itinerary.user_id == user.id
    ).order_by(desc(Itinerary.created_at)).limit(5).all()
    
    recent_orders = db.query(Order).filter(
        Order.user_id == user.id
    ).order_by(desc(Order.created_at)).limit(5).all()
    
    return UserDetailResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at,
        itineraries_count=itineraries_count,
        orders_count=orders_count,
        preferences=preferences,
        recent_itineraries=[{
            "id": it.id,
            "title": it.title,
            "days": it.days,
            "created_at": it.created_at
        } for it in recent_itineraries],
        recent_orders=[{
            "id": o.id,
            "order_no": o.order_no,
            "title": o.title,
            "total_amount": o.total_amount,
            "status": o.status,
            "created_at": o.created_at
        } for o in recent_orders]
    )

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    status: int,
    request: Request,
    admin: AdminUser = Depends(require_permission("user:edit")),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    user.status = status
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="user",
        action="update_status",
        target_type="user",
        target_id=user.id,
        target_name=user.username,
        description=f"{'启用' if status == 1 else '禁用'}用户 {user.username}"
    )
    
    return {"success": True, "message": "状态更新成功"}

@router.get("/itineraries", response_model=PaginatedResponse)
async def get_itineraries_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: AdminUser = Depends(require_permission("itinerary:list")),
    db: Session = Depends(get_db)
):
    query = db.query(Itinerary)
    
    if keyword:
        query = query.filter(Itinerary.title.contains(keyword))
    
    if user_id:
        query = query.filter(Itinerary.user_id == user_id)
    
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(Itinerary.created_at >= start)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        query = query.filter(Itinerary.created_at < end)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    
    itineraries = query.order_by(desc(Itinerary.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for it in itineraries:
        review = db.query(ItineraryReview).filter(
            ItineraryReview.itinerary_id == it.id
        ).order_by(desc(ItineraryReview.created_at)).first()
        
        review_status = review.status if review else 'draft'
        
        user = db.query(User).filter(User.id == it.user_id).first()
        
        schedules = db.query(Schedule).filter(Schedule.itinerary_id == it.id).all()
        
        items.append(ItineraryAdminResponse(
            id=it.id,
            user_id=it.user_id,
            title=it.title,
            days=it.days,
            budget=it.budget,
            departure=it.departure,
            companion_type=it.companion_type,
            interests=it.interests,
            status=review_status,
            view_count=0,
            created_at=it.created_at,
            updated_at=it.updated_at,
            user={"id": user.id, "username": user.username} if user else None,
            schedules=[{
                "id": s.id,
                "day": s.day,
                "period": s.period,
                "activity": s.activity,
                "location": s.location
            } for s in schedules]
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("/itineraries/{itinerary_id}/review")
async def review_itinerary(
    itinerary_id: int,
    review_data: ItineraryReviewCreate,
    request: Request,
    admin: AdminUser = Depends(require_permission("itinerary:review")),
    db: Session = Depends(get_db)
):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="行程不存在")
    
    review = ItineraryReview(
        itinerary_id=itinerary_id,
        reviewer_id=admin.id,
        status=review_data.status,
        review_comment=review_data.review_comment,
        reviewed_at=datetime.utcnow()
    )
    db.add(review)
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="itinerary",
        action="review",
        target_type="itinerary",
        target_id=itinerary.id,
        target_name=itinerary.title,
        description=f"审核行程 {itinerary.title}: {review_data.status}"
    )
    
    return {"success": True, "message": "审核完成"}

@router.post("/itineraries/{itinerary_id}/publish")
async def publish_itinerary(
    itinerary_id: int,
    request: Request,
    admin: AdminUser = Depends(require_permission("itinerary:publish")),
    db: Session = Depends(get_db)
):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="行程不存在")
    
    review = ItineraryReview(
        itinerary_id=itinerary_id,
        reviewer_id=admin.id,
        status='published',
        review_comment='管理员发布',
        reviewed_at=datetime.utcnow()
    )
    db.add(review)
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="itinerary",
        action="publish",
        target_type="itinerary",
        target_id=itinerary.id,
        target_name=itinerary.title,
        description=f"发布行程 {itinerary.title}"
    )
    
    return {"success": True, "message": "发布成功"}

@router.post("/itineraries/{itinerary_id}/offline")
async def offline_itinerary(
    itinerary_id: int,
    reason: str,
    request: Request,
    admin: AdminUser = Depends(require_permission("itinerary:publish")),
    db: Session = Depends(get_db)
):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="行程不存在")
    
    review = ItineraryReview(
        itinerary_id=itinerary_id,
        reviewer_id=admin.id,
        status='offline',
        review_comment=reason,
        reviewed_at=datetime.utcnow()
    )
    db.add(review)
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="itinerary",
        action="offline",
        target_type="itinerary",
        target_id=itinerary.id,
        target_name=itinerary.title,
        description=f"下架行程 {itinerary.title}: {reason}"
    )
    
    return {"success": True, "message": "下架成功"}

@router.get("/attractions", response_model=PaginatedResponse)
async def get_attractions_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    admin: AdminUser = Depends(require_permission("attraction:list")),
    db: Session = Depends(get_db)
):
    query = db.query(Attraction)
    
    if keyword:
        query = query.filter(
            or_(
                Attraction.name.contains(keyword),
                Attraction.description.contains(keyword)
            )
        )
    
    if city:
        query = query.filter(Attraction.city == city)
    
    if category:
        query = query.filter(Attraction.category == category)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    
    attractions = query.order_by(desc(Attraction.rating)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for attr in attractions:
        media_count = db.query(func.count(AttractionMedia.id)).filter(
            AttractionMedia.attraction_id == attr.id
        ).scalar() or 0
        
        items.append(AttractionAdminResponse(
            id=attr.id,
            name=attr.name,
            city=attr.city,
            category=attr.category,
            description=attr.description,
            latitude=attr.latitude,
            longitude=attr.longitude,
            address=attr.address,
            rating=attr.rating,
            popularity=attr.popularity,
            ticket_price=attr.ticket_price,
            status=1,
            created_at=attr.created_at,
            updated_at=attr.updated_at,
            media_count=media_count
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("/attractions", response_model=dict)
async def create_attraction(
    attraction_data: dict,
    request: Request,
    admin: AdminUser = Depends(require_permission("attraction:create")),
    db: Session = Depends(get_db)
):
    attraction = Attraction(**attraction_data)
    db.add(attraction)
    db.commit()
    db.refresh(attraction)
    
    await log_operation(
        db, admin, request,
        module="attraction",
        action="create",
        target_type="attraction",
        target_id=attraction.id,
        target_name=attraction.name,
        description=f"创建景点 {attraction.name}"
    )
    
    return {"success": True, "id": attraction.id, "message": "创建成功"}

@router.put("/attractions/{attraction_id}", response_model=dict)
async def update_attraction(
    attraction_id: int,
    attraction_data: dict,
    request: Request,
    admin: AdminUser = Depends(require_permission("attraction:edit")),
    db: Session = Depends(get_db)
):
    attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attraction:
        raise HTTPException(status_code=404, detail="景点不存在")
    
    for key, value in attraction_data.items():
        if hasattr(attraction, key):
            setattr(attraction, key, value)
    
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="attraction",
        action="update",
        target_type="attraction",
        target_id=attraction.id,
        target_name=attraction.name,
        description=f"更新景点 {attraction.name}"
    )
    
    return {"success": True, "message": "更新成功"}

@router.delete("/attractions/{attraction_id}")
async def delete_attraction(
    attraction_id: int,
    request: Request,
    admin: AdminUser = Depends(require_permission("attraction:delete")),
    db: Session = Depends(get_db)
):
    attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attraction:
        raise HTTPException(status_code=404, detail="景点不存在")
    
    name = attraction.name
    db.delete(attraction)
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="attraction",
        action="delete",
        target_type="attraction",
        target_id=attraction_id,
        target_name=name,
        description=f"删除景点 {name}"
    )
    
    return {"success": True, "message": "删除成功"}

@router.post("/attractions/{attraction_id}/media", response_model=dict)
async def add_attraction_media(
    attraction_id: int,
    media_data: AttractionMediaCreate,
    request: Request,
    admin: AdminUser = Depends(require_permission("attraction:edit")),
    db: Session = Depends(get_db)
):
    attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attraction:
        raise HTTPException(status_code=404, detail="景点不存在")
    
    media = AttractionMedia(
        attraction_id=attraction_id,
        type=media_data.type,
        url=media_data.url,
        thumbnail_url=media_data.thumbnail_url,
        title=media_data.title,
        description=media_data.description,
        sort_order=media_data.sort_order
    )
    db.add(media)
    db.commit()
    
    return {"success": True, "id": media.id, "message": "添加成功"}

@router.get("/orders", response_model=PaginatedResponse)
async def get_orders_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: AdminUser = Depends(require_permission("order:list")),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    
    if keyword:
        query = query.filter(
            or_(
                Order.order_no.contains(keyword),
                Order.title.contains(keyword),
                Order.contact_name.contains(keyword),
                Order.contact_phone.contains(keyword)
            )
        )
    
    if status:
        query = query.filter(Order.status == status)
    
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)
    
    if user_id:
        query = query.filter(Order.user_id == user_id)
    
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(Order.created_at >= start)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        query = query.filter(Order.created_at < end)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    
    orders = query.order_by(desc(Order.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for order in orders:
        user = db.query(User).filter(User.id == order.user_id).first()
        itinerary = db.query(Itinerary).filter(Itinerary.id == order.itinerary_id).first() if order.itinerary_id else None
        
        items.append(OrderResponse(
            id=order.id,
            order_no=order.order_no,
            user_id=order.user_id,
            itinerary_id=order.itinerary_id,
            title=order.title,
            type=order.type,
            total_amount=order.total_amount,
            paid_amount=order.paid_amount,
            discount_amount=order.discount_amount,
            contact_name=order.contact_name,
            contact_phone=order.contact_phone,
            contact_email=order.contact_email,
            travel_date=order.travel_date,
            traveler_count=order.traveler_count,
            special_requests=order.special_requests,
            status=order.status,
            payment_status=order.payment_status,
            payment_method=order.payment_method,
            payment_time=order.payment_time,
            transaction_id=order.transaction_id,
            refund_status=order.refund_status,
            refund_reason=order.refund_reason,
            refund_amount=order.refund_amount,
            refund_time=order.refund_time,
            remark=order.remark,
            extra_data=order.extra_data,
            created_at=order.created_at,
            updated_at=order.updated_at,
            user={"id": user.id, "username": user.username} if user else None,
            itinerary={"id": itinerary.id, "title": itinerary.title} if itinerary else None
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_detail(
    order_id: int,
    admin: AdminUser = Depends(require_permission("order:list")),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    user = db.query(User).filter(User.id == order.user_id).first()
    itinerary = db.query(Itinerary).filter(Itinerary.id == order.itinerary_id).first() if order.itinerary_id else None
    
    return OrderResponse(
        id=order.id,
        order_no=order.order_no,
        user_id=order.user_id,
        itinerary_id=order.itinerary_id,
        title=order.title,
        type=order.type,
        total_amount=order.total_amount,
        paid_amount=order.paid_amount,
        discount_amount=order.discount_amount,
        contact_name=order.contact_name,
        contact_phone=order.contact_phone,
        contact_email=order.contact_email,
        travel_date=order.travel_date,
        traveler_count=order.traveler_count,
        special_requests=order.special_requests,
        status=order.status,
        payment_status=order.payment_status,
        payment_method=order.payment_method,
        payment_time=order.payment_time,
        transaction_id=order.transaction_id,
        refund_status=order.refund_status,
        refund_reason=order.refund_reason,
        refund_amount=order.refund_amount,
        refund_time=order.refund_time,
        remark=order.remark,
        extra_data=order.extra_data,
        created_at=order.created_at,
        updated_at=order.updated_at,
        user={"id": user.id, "username": user.username, "email": user.email} if user else None,
        itinerary={"id": itinerary.id, "title": itinerary.title, "days": itinerary.days} if itinerary else None
    )

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: str,
    remark: Optional[str] = None,
    request: Request = None,
    admin: AdminUser = Depends(require_permission("order:process")),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order.status = status
    if remark:
        order.remark = remark
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="order",
        action="update_status",
        target_type="order",
        target_id=order.id,
        target_name=order.order_no,
        description=f"更新订单状态为 {status}"
    )
    
    return {"success": True, "message": "状态更新成功"}

@router.post("/orders/{order_id}/refund")
async def process_refund(
    order_id: int,
    refund_reason: str,
    refund_amount: Optional[float] = None,
    request: Request = None,
    admin: AdminUser = Depends(require_permission("order:refund")),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order.payment_status != 'paid':
        raise HTTPException(status_code=400, detail="订单未支付，无法退款")
    
    if order.refund_status == 'refunded':
        raise HTTPException(status_code=400, detail="订单已退款")
    
    actual_refund = refund_amount or order.paid_amount
    
    order.refund_status = 'refunded'
    order.refund_reason = refund_reason
    order.refund_amount = actual_refund
    order.refund_time = datetime.utcnow()
    order.status = 'refunded'
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="order",
        action="refund",
        target_type="order",
        target_id=order.id,
        target_name=order.order_no,
        description=f"处理退款 {order.order_no}: {actual_refund}元"
    )
    
    return {"success": True, "message": "退款处理成功", "refund_amount": actual_refund}

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(
    admin: AdminUser = Depends(require_permission("system:role")),
    db: Session = Depends(get_db)
):
    roles = db.query(Role).order_by(Role.sort_order).all()
    
    return [RoleResponse(
        id=r.id,
        name=r.name,
        code=r.code,
        description=r.description,
        status=r.status,
        sort_order=r.sort_order,
        created_at=r.created_at,
        permissions=[{"id": p.id, "name": p.name, "code": p.code} for p in r.permissions]
    ) for r in roles]

@router.post("/roles", response_model=dict)
async def create_role(
    role_data: RoleCreate,
    request: Request,
    admin: AdminUser = Depends(require_permission("system:role")),
    db: Session = Depends(get_db)
):
    existing = db.query(Role).filter(Role.code == role_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="角色编码已存在")
    
    role = Role(
        name=role_data.name,
        code=role_data.code,
        description=role_data.description
    )
    
    if role_data.permission_ids:
        permissions = db.query(Permission).filter(Permission.id.in_(role_data.permission_ids)).all()
        role.permissions = permissions
    
    db.add(role)
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="system",
        action="create_role",
        target_type="role",
        target_id=role.id,
        target_name=role.name,
        description=f"创建角色 {role.name}"
    )
    
    return {"success": True, "id": role.id, "message": "创建成功"}

@router.put("/roles/{role_id}", response_model=dict)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    request: Request,
    admin: AdminUser = Depends(require_permission("system:role")),
    db: Session = Depends(get_db)
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")
    
    if role_data.name:
        role.name = role_data.name
    if role_data.description:
        role.description = role_data.description
    if role_data.status is not None:
        role.status = role_data.status
    if role_data.sort_order is not None:
        role.sort_order = role_data.sort_order
    if role_data.permission_ids is not None:
        permissions = db.query(Permission).filter(Permission.id.in_(role_data.permission_ids)).all()
        role.permissions = permissions
    
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="system",
        action="update_role",
        target_type="role",
        target_id=role.id,
        target_name=role.name,
        description=f"更新角色 {role.name}"
    )
    
    return {"success": True, "message": "更新成功"}

@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    request: Request,
    admin: AdminUser = Depends(require_permission("system:role")),
    db: Session = Depends(get_db)
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")
    
    if role.code == 'admin':
        raise HTTPException(status_code=400, detail="不能删除超级管理员角色")
    
    name = role.name
    db.delete(role)
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="system",
        action="delete_role",
        target_type="role",
        target_id=role_id,
        target_name=name,
        description=f"删除角色 {name}"
    )
    
    return {"success": True, "message": "删除成功"}

@router.get("/permissions", response_model=List[PermissionResponse])
async def get_permissions(
    admin: AdminUser = Depends(require_permission("system:permission")),
    db: Session = Depends(get_db)
):
    permissions = db.query(Permission).filter(Permission.parent_id == None).order_by(Permission.sort_order).all()
    
    def build_tree(perm):
        children = db.query(Permission).filter(Permission.parent_id == perm.id).order_by(Permission.sort_order).all()
        return PermissionResponse(
            id=perm.id,
            name=perm.name,
            code=perm.code,
            type=perm.type,
            parent_id=perm.parent_id,
            path=perm.path,
            icon=perm.icon,
            component=perm.component,
            api_path=perm.api_path,
            method=perm.method,
            sort_order=perm.sort_order,
            status=perm.status,
            created_at=perm.created_at,
            children=[build_tree(c) for c in children]
        )
    
    return [build_tree(p) for p in permissions]

@router.get("/operation-logs", response_model=PaginatedResponse)
async def get_operation_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    module: Optional[str] = None,
    action: Optional[str] = None,
    operator: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: AdminUser = Depends(require_permission("system:log")),
    db: Session = Depends(get_db)
):
    query = db.query(OperationLog)
    
    if module:
        query = query.filter(OperationLog.module == module)
    if action:
        query = query.filter(OperationLog.action == action)
    if operator:
        query = query.filter(OperationLog.operator_name.contains(operator))
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(OperationLog.created_at >= start)
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        query = query.filter(OperationLog.created_at < end)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    
    logs = query.order_by(desc(OperationLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedResponse(
        items=[OperationLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/admin-users", response_model=PaginatedResponse)
async def get_admin_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    admin: AdminUser = Depends(require_permission("user:list")),
    db: Session = Depends(get_db)
):
    query = db.query(AdminUser)
    
    if keyword:
        query = query.filter(
            or_(
                AdminUser.username.contains(keyword),
                AdminUser.email.contains(keyword),
                AdminUser.real_name.contains(keyword)
            )
        )
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    
    users = query.order_by(desc(AdminUser.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = [AdminUserResponse(
        id=u.id,
        username=u.username,
        email=u.email,
        real_name=u.real_name,
        phone=u.phone,
        avatar=u.avatar,
        status=u.status,
        is_superuser=u.is_superuser,
        last_login=u.last_login,
        last_login_ip=u.last_login_ip,
        created_at=u.created_at,
        roles=[{"id": r.id, "name": r.name, "code": r.code} for r in u.roles]
    ) for u in users]
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("/admin-users", response_model=dict)
async def create_admin_user(
    user_data: AdminUserCreate,
    request: Request,
    admin: AdminUser = Depends(require_permission("user:create")),
    db: Session = Depends(get_db)
):
    existing = db.query(AdminUser).filter(
        or_(
            AdminUser.username == user_data.username,
            AdminUser.email == user_data.email
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名或邮箱已存在")
    
    user = AdminUser(
        username=user_data.username,
        email=user_data.email,
        password=get_password_hash(user_data.password),
        real_name=user_data.real_name,
        phone=user_data.phone,
        is_superuser=user_data.is_superuser
    )
    
    if user_data.role_ids:
        roles = db.query(Role).filter(Role.id.in_(user_data.role_ids)).all()
        user.roles = roles
    
    db.add(user)
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="admin",
        action="create_user",
        target_type="admin_user",
        target_id=user.id,
        target_name=user.username,
        description=f"创建管理员 {user.username}"
    )
    
    return {"success": True, "id": user.id, "message": "创建成功"}

@router.put("/admin-users/{user_id}", response_model=dict)
async def update_admin_user(
    user_id: int,
    user_data: AdminUserUpdate,
    request: Request,
    admin: AdminUser = Depends(require_permission("user:edit")),
    db: Session = Depends(get_db)
):
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    if user_data.email:
        user.email = user_data.email
    if user_data.real_name:
        user.real_name = user_data.real_name
    if user_data.phone:
        user.phone = user_data.phone
    if user_data.avatar:
        user.avatar = user_data.avatar
    if user_data.status is not None:
        user.status = user_data.status
    if user_data.role_ids is not None:
        roles = db.query(Role).filter(Role.id.in_(user_data.role_ids)).all()
        user.roles = roles
    
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="admin",
        action="update_user",
        target_type="admin_user",
        target_id=user.id,
        target_name=user.username,
        description=f"更新管理员 {user.username}"
    )
    
    return {"success": True, "message": "更新成功"}

@router.delete("/admin-users/{user_id}")
async def delete_admin_user(
    user_id: int,
    request: Request,
    admin: AdminUser = Depends(require_permission("user:delete")),
    db: Session = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="不能删除自己的账户")
    
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    if user.is_superuser:
        raise HTTPException(status_code=400, detail="不能删除超级管理员")
    
    username = user.username
    db.delete(user)
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="admin",
        action="delete_user",
        target_type="admin_user",
        target_id=user_id,
        target_name=username,
        description=f"删除管理员 {username}"
    )
    
    return {"success": True, "message": "删除成功"}

@router.get("/system/configs")
async def get_system_configs(
    group: Optional[str] = None,
    admin: AdminUser = Depends(require_permission("system")),
    db: Session = Depends(get_db)
):
    query = db.query(SystemConfig)
    if group:
        query = query.filter(SystemConfig.group == group)
    
    configs = query.all()
    return {c.key: c.value for c in configs}

@router.put("/system/configs")
async def update_system_configs(
    config_data: SystemConfigUpdate,
    request: Request,
    admin: AdminUser = Depends(require_permission("system")),
    db: Session = Depends(get_db)
):
    for key, value in config_data.configs.items():
        config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if config:
            config.value = value
        else:
            config = SystemConfig(key=key, value=value)
            db.add(config)
    
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="system",
        action="update_config",
        description="更新系统配置"
    )
    
    return {"success": True, "message": "配置更新成功"}

@router.post("/system/backup")
async def create_backup(
    backup_data: BackupCreate,
    request: Request,
    admin: AdminUser = Depends(require_permission("system:backup")),
    db: Session = Depends(get_db)
):
    import subprocess
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    name = backup_data.name or f"backup_{timestamp}"
    backup_dir = "backups"
    os.makedirs(backup_dir, exist_ok=True)
    file_path = os.path.join(backup_dir, f"{name}.db")
    
    try:
        import shutil
        shutil.copy("travel_planner.db", file_path)
        
        backup = DataBackup(
            name=name,
            type='manual',
            file_path=file_path,
            file_size=os.path.getsize(file_path),
            status='completed',
            operator_id=admin.id
        )
        db.add(backup)
        db.commit()
        
        await log_operation(
            db, admin, request,
            module="system",
            action="backup",
            target_type="backup",
            target_id=backup.id,
            target_name=name,
            description=f"创建数据备份 {name}"
        )
        
        return {"success": True, "id": backup.id, "file_path": file_path, "message": "备份创建成功"}
    except Exception as e:
        return {"success": False, "message": f"备份失败: {str(e)}"}

@router.get("/system/backups")
async def get_backups(
    admin: AdminUser = Depends(require_permission("system:backup")),
    db: Session = Depends(get_db)
):
    backups = db.query(DataBackup).order_by(desc(DataBackup.created_at)).limit(20).all()
    return [{
        "id": b.id,
        "name": b.name,
        "type": b.type,
        "file_path": b.file_path,
        "file_size": b.file_size,
        "status": b.status,
        "created_at": b.created_at
    } for b in backups]

@router.get("/online-users")
async def get_online_users(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    threshold = datetime.utcnow() - timedelta(minutes=30)
    online = db.query(OnlineUser).filter(OnlineUser.last_activity >= threshold).all()
    
    return [{
        "user_id": o.user_id,
        "user_type": o.user_type,
        "ip_address": o.ip_address,
        "login_time": o.login_time,
        "last_activity": o.last_activity,
        "page_url": o.page_url
    } for o in online]

@router.get("/announcements")
async def get_announcements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total = db.query(func.count(Announcement.id)).scalar()
    announcements = db.query(Announcement).order_by(desc(Announcement.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedResponse(
        items=[{
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "type": a.type,
            "priority": a.priority,
            "status": a.status,
            "publish_time": a.publish_time,
            "expire_time": a.expire_time,
            "target_users": a.target_users,
            "view_count": a.view_count,
            "created_at": a.created_at
        } for a in announcements],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.post("/announcements")
async def create_announcement(
    announcement_data: AnnouncementCreate,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    announcement = Announcement(
        title=announcement_data.title,
        content=announcement_data.content,
        type=announcement_data.type,
        priority=announcement_data.priority,
        target_users=announcement_data.target_users,
        publish_time=announcement_data.publish_time,
        expire_time=announcement_data.expire_time,
        creator_id=admin.id
    )
    db.add(announcement)
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="announcement",
        action="create",
        target_type="announcement",
        target_id=announcement.id,
        target_name=announcement.title,
        description=f"创建公告 {announcement.title}"
    )
    
    return {"success": True, "id": announcement.id, "message": "创建成功"}

@router.get("/feedbacks")
async def get_feedbacks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    type: Optional[str] = None,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Feedback)
    
    if status:
        query = query.filter(Feedback.status == status)
    if type:
        query = query.filter(Feedback.type == type)
    
    total = query.count()
    feedbacks = query.order_by(desc(Feedback.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedResponse(
        items=[FeedbackResponse.model_validate(f) for f in feedbacks],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.post("/feedbacks/{feedback_id}/reply")
async def reply_feedback(
    feedback_id: int,
    reply_data: FeedbackReply,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="反馈不存在")
    
    feedback.reply = reply_data.reply
    feedback.reply_time = datetime.utcnow()
    feedback.reply_user_id = admin.id
    feedback.status = 'replied'
    db.commit()
    
    await log_operation(
        db, admin, request,
        module="feedback",
        action="reply",
        target_type="feedback",
        target_id=feedback.id,
        description=f"回复反馈 #{feedback.id}"
    )
    
    return {"success": True, "message": "回复成功"}

@router.get("/cities")
async def get_cities_for_admin(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    cities = db.query(City).all()
    return [{
        "id": c.id,
        "name": c.name,
        "province": c.province,
        "attraction_count": db.query(func.count(Attraction.id)).filter(Attraction.city == c.name).scalar() or 0
    } for c in cities]

@router.get("/categories")
async def get_categories(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    categories = db.query(Attraction.category).distinct().all()
    return [c[0] for c in categories if c[0]]
