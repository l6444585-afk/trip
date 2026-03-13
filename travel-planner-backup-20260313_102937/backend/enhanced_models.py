"""
增强版数据模型
包含精确地理位置坐标、场所开放时间、建议游玩时长等核心字段
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, JSON, Date, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, time

Base = declarative_base()

class City(Base):
    __tablename__ = "cities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    province = Column(String(50))
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(Text)
    best_season = Column(String(100))
    avg_daily_cost = Column(Float)
    highlights = Column(Text)
    
    timezone = Column(String(50), default="Asia/Shanghai")
    population = Column(Integer, nullable=True)
    area_km2 = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    attractions = relationship("Attraction", back_populates="city_obj")
    restaurants = relationship("Restaurant", back_populates="city_obj")
    hotels = relationship("Hotel", back_populates="city_obj")

class Attraction(Base):
    __tablename__ = "attractions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True)
    city = Column(String(50), index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)
    category = Column(String(50), index=True)
    description = Column(Text)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500))
    
    rating = Column(Float, default=0.0)
    popularity = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    
    avg_visit_duration = Column(Integer, default=120)
    recommended_duration_min = Column(Integer, default=60)
    recommended_duration_max = Column(Integer, default=240)
    
    open_time = Column(String(10), default="08:00")
    close_time = Column(String(10), default="18:00")
    closed_days = Column(String(50), default="")
    
    open_time_weekend = Column(String(10), nullable=True)
    close_time_weekend = Column(String(10), nullable=True)
    
    open_time_peak = Column(String(10), nullable=True)
    close_time_peak = Column(String(10), nullable=True)
    peak_season_start = Column(String(10), nullable=True)
    peak_season_end = Column(String(10), nullable=True)
    
    ticket_price = Column(Float, default=0.0)
    ticket_price_peak = Column(Float, default=0.0)
    ticket_price_student = Column(Float, nullable=True)
    ticket_price_senior = Column(Float, nullable=True)
    ticket_price_child = Column(Float, nullable=True)
    ticket_free_for_children_under = Column(Integer, nullable=True)
    
    booking_required = Column(Boolean, default=False)
    booking_advance_days = Column(Integer, default=0)
    booking_url = Column(String(500), nullable=True)
    booking_phone = Column(String(50), nullable=True)
    daily_visitor_limit = Column(Integer, nullable=True)
    
    tags = Column(Text, default="")
    suitable_for = Column(Text, default="")
    
    best_time_to_visit = Column(String(100))
    peak_hours = Column(String(100), default="10:00-14:00")
    recommended_visit_order = Column(Integer, default=0)
    
    indoor_outdoor = Column(String(20), default="outdoor")
    weather_sensitive = Column(Boolean, default=True)
    accessibility_score = Column(Float, default=0.0)
    wheelchair_accessible = Column(Boolean, default=False)
    
    image_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    official_account = Column(String(100), nullable=True)
    
    tips = Column(Text, nullable=True)
    warnings = Column(Text, nullable=True)
    nearby_attractions = Column(Text, nullable=True)
    
    data_quality_score = Column(Float, default=0.0)
    last_verified_at = Column(DateTime, nullable=True)
    data_source = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    city_obj = relationship("City", back_populates="attractions")
    schedules = relationship("Schedule", back_populates="attraction")
    business_rules = relationship("BusinessRule", back_populates="attraction")

class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True)
    city = Column(String(50), index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)
    address = Column(String(500))
    latitude = Column(Float)
    longitude = Column(Float)
    
    category = Column(String(50))
    cuisine_type = Column(String(100))
    price_level = Column(Integer, default=2)
    avg_cost_per_person = Column(Float)
    
    rating = Column(Float, default=0.0)
    popularity = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    
    open_time = Column(String(10), default="10:00")
    close_time = Column(String(10), default="22:00")
    closed_days = Column(String(50), default="")
    
    open_time_weekend = Column(String(10), nullable=True)
    close_time_weekend = Column(String(10), nullable=True)
    
    specialty_dishes = Column(Text)
    suitable_for = Column(Text)
    tags = Column(Text)
    
    phone = Column(String(50), nullable=True)
    image_url = Column(String(500), nullable=True)
    
    reservation_required = Column(Boolean, default=False)
    reservation_url = Column(String(500), nullable=True)
    
    tips = Column(Text, nullable=True)
    
    data_quality_score = Column(Float, default=0.0)
    last_verified_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    city_obj = relationship("City", back_populates="restaurants")

class Hotel(Base):
    __tablename__ = "hotels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True)
    city = Column(String(50), index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)
    address = Column(String(500))
    latitude = Column(Float)
    longitude = Column(Float)
    
    hotel_type = Column(String(50))
    star_rating = Column(Integer, default=3)
    price_level = Column(Integer, default=2)
    
    price_min = Column(Float)
    price_max = Column(Float)
    price_peak_min = Column(Float, nullable=True)
    price_peak_max = Column(Float, nullable=True)
    
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    
    amenities = Column(Text)
    suitable_for = Column(Text)
    tags = Column(Text)
    
    check_in_time = Column(String(10), default="14:00")
    check_out_time = Column(String(10), default="12:00")
    
    phone = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)
    
    tips = Column(Text, nullable=True)
    
    data_quality_score = Column(Float, default=0.0)
    last_verified_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    city_obj = relationship("City", back_populates="hotels")

class TransportMatrix(Base):
    __tablename__ = "transport_matrix"
    
    id = Column(Integer, primary_key=True, index=True)
    from_city = Column(String(50), index=True)
    to_city = Column(String(50), index=True)
    transport_type = Column(String(20))
    duration_minutes = Column(Integer)
    cost_min = Column(Float)
    cost_max = Column(Float)
    frequency = Column(String(100))
    notes = Column(Text)
    
    distance_km = Column(Float, nullable=True)
    first_departure = Column(String(10), nullable=True)
    last_departure = Column(String(10), nullable=True)
    
    peak_hour_surcharge = Column(Float, default=0.0)
    weekend_surcharge = Column(Float, default=0.0)
    holiday_surcharge = Column(Float, default=0.0)
    
    data_quality_score = Column(Float, default=0.0)
    last_verified_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TransportHub(Base):
    __tablename__ = "transport_hubs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    city = Column(String(50), index=True)
    hub_type = Column(String(50))
    
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String(500))
    
    code = Column(String(20), nullable=True)
    
    is_main_hub = Column(Boolean, default=False)
    
    to_city_center_minutes = Column(Integer, nullable=True)
    to_city_center_cost_min = Column(Float, nullable=True)
    to_city_center_cost_max = Column(Float, nullable=True)
    to_city_center_transport = Column(String(50), nullable=True)
    
    facilities = Column(Text, nullable=True)
    tips = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class HubToAttraction(Base):
    __tablename__ = "hub_to_attraction"
    
    id = Column(Integer, primary_key=True, index=True)
    hub_id = Column(Integer, ForeignKey("transport_hubs.id"))
    attraction_id = Column(Integer, ForeignKey("attractions.id"))
    
    transport_mode = Column(String(50))
    duration_minutes = Column(Integer)
    distance_km = Column(Float, nullable=True)
    cost_min = Column(Float, nullable=True)
    cost_max = Column(Float, nullable=True)
    
    route_description = Column(Text, nullable=True)
    tips = Column(Text, nullable=True)
    
    is_recommended = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BusinessRule(Base):
    __tablename__ = "business_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_type = Column(String(50), index=True)
    rule_name = Column(String(200))
    description = Column(Text)
    
    attraction_id = Column(Integer, ForeignKey("attractions.id"), nullable=True)
    city = Column(String(50), nullable=True)
    
    condition_type = Column(String(50))
    condition_value = Column(Text)
    
    action_type = Column(String(50))
    action_value = Column(Text)
    
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    effective_start_date = Column(Date, nullable=True)
    effective_end_date = Column(Date, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    attraction = relationship("Attraction", back_populates="business_rules")

class Holiday(Base):
    __tablename__ = "holidays"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    date = Column(Date, index=True)
    is_public_holiday = Column(Boolean, default=True)
    
    affected_cities = Column(Text, nullable=True)
    special_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


