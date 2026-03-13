from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    OPERATOR = "operator"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAID = "paid"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    REFUNDED = "refunded"

class ItineraryStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    PUBLISHED = "published"
    OFFLINE = "offline"

class AdminUserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    real_name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)

class AdminUserCreate(AdminUserBase):
    password: str = Field(..., min_length=6, max_length=50)
    role_ids: List[int] = []
    is_superuser: bool = False

class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    real_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    status: Optional[int] = None
    role_ids: Optional[List[int]] = None

class AdminUserResponse(AdminUserBase):
    id: int
    avatar: Optional[str]
    status: int
    is_superuser: bool
    last_login: Optional[datetime]
    last_login_ip: Optional[str]
    created_at: datetime
    roles: List[Dict[str, Any]] = []
    
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str = Field(..., max_length=50)
    code: str = Field(..., max_length=50)
    description: Optional[str] = Field(None, max_length=200)

class RoleCreate(RoleBase):
    permission_ids: List[int] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[int] = None
    sort_order: Optional[int] = None
    permission_ids: Optional[List[int]] = None

class RoleResponse(RoleBase):
    id: int
    status: int
    sort_order: int
    created_at: datetime
    permissions: List[Dict[str, Any]] = []
    
    class Config:
        from_attributes = True

class PermissionBase(BaseModel):
    name: str = Field(..., max_length=50)
    code: str = Field(..., max_length=100)
    type: str = Field(default='button')
    parent_id: Optional[int] = None
    path: Optional[str] = None
    icon: Optional[str] = None
    component: Optional[str] = None
    api_path: Optional[str] = None
    method: Optional[str] = None
    sort_order: int = 0

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    parent_id: Optional[int] = None
    path: Optional[str] = None
    icon: Optional[str] = None
    component: Optional[str] = None
    api_path: Optional[str] = None
    method: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[int] = None

class PermissionResponse(PermissionBase):
    id: int
    status: int
    created_at: datetime
    children: List['PermissionResponse'] = []
    
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    order_no: str
    user_id: int
    itinerary_id: Optional[int] = None
    title: Optional[str] = None
    type: str = 'itinerary'
    total_amount: float = 0.0
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    travel_date: Optional[datetime] = None
    traveler_count: int = 1
    special_requests: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    refund_status: Optional[str] = None
    refund_reason: Optional[str] = None
    refund_amount: Optional[float] = None
    remark: Optional[str] = None

class OrderResponse(OrderBase):
    id: int
    paid_amount: float
    discount_amount: float
    status: str
    payment_status: str
    payment_method: Optional[str]
    payment_time: Optional[datetime]
    transaction_id: Optional[str]
    refund_status: str
    refund_reason: Optional[str]
    refund_amount: float
    refund_time: Optional[datetime]
    remark: Optional[str]
    extra_data: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    user: Optional[Dict[str, Any]] = None
    itinerary: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class OperationLogResponse(BaseModel):
    id: int
    operator_id: Optional[int]
    operator_name: Optional[str]
    operator_ip: Optional[str]
    module: Optional[str]
    action: Optional[str]
    target_type: Optional[str]
    target_id: Optional[int]
    target_name: Optional[str]
    description: Optional[str]
    request_method: Optional[str]
    request_url: Optional[str]
    status: int
    duration_ms: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    itineraries_count: int = 0
    orders_count: int = 0
    
    class Config:
        from_attributes = True

class UserDetailResponse(UserListResponse):
    preferences: Optional[Dict[str, Any]] = None
    recent_itineraries: List[Dict[str, Any]] = []
    recent_orders: List[Dict[str, Any]] = []

class ItineraryAdminResponse(BaseModel):
    id: int
    user_id: int
    title: str
    days: int
    budget: float
    departure: str
    companion_type: Optional[str]
    interests: Optional[str]
    status: str = 'draft'
    view_count: int = 0
    created_at: datetime
    updated_at: datetime
    user: Optional[Dict[str, Any]] = None
    schedules: List[Dict[str, Any]] = []
    
    class Config:
        from_attributes = True

class AttractionAdminResponse(BaseModel):
    id: int
    name: str
    city: str
    category: Optional[str]
    description: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    rating: float
    popularity: int
    ticket_price: float
    status: int = 1
    created_at: datetime
    updated_at: datetime
    media_count: int = 0
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_users: int
    new_users_today: int
    new_users_week: int
    new_users_month: int
    active_users_today: int
    
    total_itineraries: int
    new_itineraries_today: int
    published_itineraries: int
    pending_review: int
    
    total_orders: int
    today_orders: int
    today_revenue: float
    month_revenue: float
    total_revenue: float
    
    total_attractions: int
    total_cities: int

class RevenueTrend(BaseModel):
    date: str
    revenue: float
    orders: int

class PopularItinerary(BaseModel):
    id: int
    title: str
    view_count: int
    order_count: int
    revenue: float

class UserActivityTrend(BaseModel):
    date: str
    new_users: int
    active_users: int
    logins: int

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

class AdminLogin(BaseModel):
    username: str
    password: str
    captcha: Optional[str] = None

class AdminToken(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 7200
    user: Dict[str, Any]

class SystemConfigUpdate(BaseModel):
    configs: Dict[str, str]

class BackupCreate(BaseModel):
    name: Optional[str] = None
    tables: Optional[List[str]] = None

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    type: str = 'notice'
    priority: int = 0
    target_users: str = 'all'
    publish_time: Optional[datetime] = None
    expire_time: Optional[datetime] = None

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[int] = None
    target_users: Optional[str] = None
    publish_time: Optional[datetime] = None
    expire_time: Optional[datetime] = None

class FeedbackResponse(BaseModel):
    id: int
    user_id: Optional[int]
    type: str
    title: Optional[str]
    content: str
    images: Optional[str]
    contact: Optional[str]
    status: str
    reply: Optional[str]
    reply_time: Optional[datetime]
    created_at: datetime
    user: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class FeedbackReply(BaseModel):
    reply: str

class ItineraryReviewCreate(BaseModel):
    itinerary_id: int
    status: str
    review_comment: Optional[str] = None

class AttractionMediaCreate(BaseModel):
    attraction_id: int
    type: str = 'image'
    url: str
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0

class DataExportRequest(BaseModel):
    type: str
    filters: Optional[Dict[str, Any]] = None
    format: str = 'xlsx'

PermissionResponse.model_rebuild()
