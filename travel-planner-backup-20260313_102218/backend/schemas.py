from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    password: str = Field(..., min_length=6, max_length=100)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserPreferenceCreate(BaseModel):
    favorite_destinations: Optional[List[str]] = []
    disliked_destinations: Optional[List[str]] = []
    dietary_restrictions: Optional[List[str]] = []
    mobility_constraints: Optional[List[str]] = []
    preferred_pace: Optional[str] = Field(default="normal", pattern=r'^(relaxed|normal|tight)$')
    budget_preference: Optional[str] = Field(default="medium", pattern=r'^(low|medium|high)$')
    interests: Optional[List[str]] = []
    companion_history: Optional[List[str]] = []

class UserPreferenceResponse(BaseModel):
    id: int
    user_id: int
    favorite_destinations: Optional[str]
    disliked_destinations: Optional[str]
    dietary_restrictions: Optional[str]
    mobility_constraints: Optional[str]
    preferred_pace: str
    budget_preference: str
    interests: Optional[str]
    companion_history: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ItineraryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    days: int = Field(..., ge=1, le=30)
    budget: float = Field(..., ge=0)
    departure: str = Field(..., min_length=1, max_length=100)
    companion_type: str = Field(..., pattern=r'^(情侣|亲子|独行|朋友|家庭)$')
    interests: List[str] = Field(..., min_items=1)
    destinations: Optional[List[str]] = Field(default=[], max_length=3)
    travel_style: Optional[str] = Field(default="精品深度")
    budget_breakdown: Optional[Dict[str, float]] = None
    date_range: Optional[List[str]] = None
    travel_mode: Optional[str] = Field(default="公共交通", pattern=r'^(公共交通|自驾|高铁|飞机|混合)$')
    age_group: Optional[str] = Field(default="成年人", pattern=r'^(儿童|青少年|成年人|中老年人|混合年龄)$')
    pace_preference: Optional[str] = Field(default="适中", pattern=r'^(轻松|适中|紧凑)$')
    special_needs: Optional[List[str]] = Field(default=[], max_length=5)

class ItineraryResponse(BaseModel):
    id: int
    user_id: int
    title: str
    days: int
    budget: float
    departure: str
    companion_type: str
    interests: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ScheduleCreate(BaseModel):
    day: int = Field(..., ge=1)
    period: str = Field(..., pattern=r'^(morning|afternoon|evening)$')
    activity: str = Field(..., min_length=1, max_length=500)
    location: str = Field(..., min_length=1, max_length=200)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    attraction_id: Optional[int] = None

class ScheduleResponse(BaseModel):
    id: int
    itinerary_id: int
    day: int
    period: str
    activity: str
    location: str
    latitude: Optional[float]
    longitude: Optional[float]
    notes: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]
    attraction_id: Optional[int]
    
    class Config:
        from_attributes = True

class CityCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    province: str = Field(..., min_length=1, max_length=50)
    latitude: float
    longitude: float
    description: Optional[str] = None
    best_season: Optional[str] = None
    avg_daily_cost: Optional[float] = None
    highlights: Optional[List[str]] = []

class CityResponse(BaseModel):
    id: int
    name: str
    province: str
    latitude: float
    longitude: float
    description: Optional[str]
    best_season: Optional[str]
    avg_daily_cost: Optional[float]
    highlights: Optional[str]
    
    class Config:
        from_attributes = True

class AttractionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    city: str = Field(..., min_length=1, max_length=50)
    category: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    rating: Optional[float] = Field(default=0.0, ge=0.0, le=5.0)
    avg_visit_duration: Optional[int] = Field(default=120, ge=15)
    open_time: Optional[str] = Field(default="08:00")
    close_time: Optional[str] = Field(default="18:00")
    closed_days: Optional[str] = Field(default="")
    ticket_price: Optional[float] = Field(default=0.0, ge=0)
    ticket_price_peak: Optional[float] = Field(default=0.0, ge=0)
    booking_required: Optional[bool] = False
    booking_advance_days: Optional[int] = Field(default=0, ge=0)
    booking_url: Optional[str] = None
    tags: Optional[List[str]] = []
    suitable_for: Optional[List[str]] = []
    best_time_to_visit: Optional[str] = None
    peak_hours: Optional[str] = Field(default="10:00-14:00")
    image_url: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    tips: Optional[str] = None
    warnings: Optional[str] = None

class AttractionResponse(BaseModel):
    id: int
    name: str
    city: str
    city_id: Optional[int]
    category: str
    description: Optional[str]
    latitude: float
    longitude: float
    address: Optional[str]
    rating: float
    popularity: int
    avg_visit_duration: int
    recommended_duration: int
    open_time: str
    close_time: str
    closed_days: Optional[str]
    ticket_price: float
    ticket_price_peak: float
    booking_required: bool
    booking_advance_days: int
    booking_url: Optional[str]
    tags: Optional[str]
    suitable_for: Optional[str]
    best_time_to_visit: Optional[str]
    peak_hours: Optional[str]
    image_url: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    tips: Optional[str]
    warnings: Optional[str]
    
    class Config:
        from_attributes = True

class TransportMatrixCreate(BaseModel):
    from_city: str = Field(..., min_length=1, max_length=50)
    to_city: str = Field(..., min_length=1, max_length=50)
    transport_type: str = Field(..., pattern=r'^(高铁|动车|自驾|大巴|地铁|飞机)$')
    duration_minutes: int = Field(..., ge=1)
    cost_min: float = Field(..., ge=0)
    cost_max: float = Field(..., ge=0)
    frequency: Optional[str] = None
    notes: Optional[str] = None

class TransportMatrixResponse(BaseModel):
    id: int
    from_city: str
    to_city: str
    transport_type: str
    duration_minutes: int
    cost_min: float
    cost_max: float
    frequency: Optional[str]
    notes: Optional[str]
    
    class Config:
        from_attributes = True

class RestaurantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    city: str = Field(..., min_length=1, max_length=50)
    address: Optional[str] = None
    latitude: float
    longitude: float
    category: Optional[str] = None
    cuisine_type: Optional[str] = None
    price_level: Optional[int] = Field(default=2, ge=1, le=5)
    avg_cost_per_person: Optional[float] = None
    rating: Optional[float] = Field(default=0.0, ge=0.0, le=5.0)
    open_time: Optional[str] = Field(default="10:00")
    close_time: Optional[str] = Field(default="22:00")
    closed_days: Optional[str] = Field(default="")
    specialty_dishes: Optional[List[str]] = []
    suitable_for: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    phone: Optional[str] = None
    image_url: Optional[str] = None
    tips: Optional[str] = None

class RestaurantResponse(BaseModel):
    id: int
    name: str
    city: str
    address: Optional[str]
    latitude: float
    longitude: float
    category: Optional[str]
    cuisine_type: Optional[str]
    price_level: int
    avg_cost_per_person: Optional[float]
    rating: float
    popularity: int
    open_time: str
    close_time: str
    closed_days: Optional[str]
    specialty_dishes: Optional[str]
    suitable_for: Optional[str]
    tags: Optional[str]
    phone: Optional[str]
    image_url: Optional[str]
    tips: Optional[str]
    
    class Config:
        from_attributes = True

class ItineraryDetailResponse(ItineraryResponse):
    schedules: List[ScheduleResponse] = []

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    itinerary_id: Optional[int] = None
    chat_history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    answer: str
    timestamp: datetime = Field(default_factory=datetime.now)
