from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    itineraries = relationship("Itinerary", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user", uselist=False)

class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    favorite_destinations = Column(Text)
    disliked_destinations = Column(Text)
    dietary_restrictions = Column(Text)
    mobility_constraints = Column(Text)
    preferred_pace = Column(String(20), default="normal")
    budget_preference = Column(String(20), default="medium")
    interests = Column(Text)
    companion_history = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="preferences")
    preference_vectors = relationship("UserPreferenceVector", back_populates="user_preference", cascade="all, delete-orphan")


class UserPreferenceVector(Base):
    __tablename__ = "user_preference_vectors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_preference_id = Column(Integer, ForeignKey("user_preferences.id"))
    preference_id = Column(String(32), unique=True, index=True)
    category = Column(String(50), index=True)
    value = Column(String(500))
    source = Column(String(50))
    confidence = Column(Float, default=0.8)
    embedding = Column(Text)
    extra_metadata = Column(JSON, nullable=True)
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user_preference = relationship("UserPreference", back_populates="preference_vectors")

class Itinerary(Base):
    __tablename__ = "itineraries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200))
    days = Column(Integer)
    budget = Column(Float)
    departure = Column(String(100))
    companion_type = Column(String(50))
    interests = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="itineraries")
    schedules = relationship("Schedule", back_populates="itinerary")

class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id"))
    day = Column(Integer)
    period = Column(String(20))
    activity = Column(String(500))
    location = Column(String(200))
    latitude = Column(Float)
    longitude = Column(Float)
    notes = Column(Text)
    start_time = Column(String(10))
    end_time = Column(String(10))
    attraction_id = Column(Integer, ForeignKey("attractions.id"), nullable=True)
    
    itinerary = relationship("Itinerary", back_populates="schedules")
    attraction = relationship("Attraction", back_populates="schedules")

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
    
    attractions = relationship("Attraction", back_populates="city_obj")

class Attraction(Base):
    __tablename__ = "attractions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True)
    city = Column(String(50), index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)
    category = Column(String(50), index=True)
    description = Column(Text)
    
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String(500))
    
    rating = Column(Float, default=0.0)
    popularity = Column(Integer, default=0)
    
    avg_visit_duration = Column(Integer, default=120)
    recommended_duration = Column(Integer, default=120)
    
    open_time = Column(String(10), default="08:00")
    close_time = Column(String(10), default="18:00")
    closed_days = Column(String(20), default="")
    
    ticket_price = Column(Float, default=0.0)
    ticket_price_peak = Column(Float, default=0.0)
    
    booking_required = Column(Boolean, default=False)
    booking_advance_days = Column(Integer, default=0)
    booking_url = Column(String(500), nullable=True)
    
    tags = Column(Text, default="")
    suitable_for = Column(Text, default="")
    
    best_time_to_visit = Column(String(100))
    peak_hours = Column(String(100), default="10:00-14:00")
    
    image_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    
    tips = Column(Text, nullable=True)
    warnings = Column(Text, nullable=True)
    
    platform_links = Column(JSON, nullable=True)
    images = Column(JSON, nullable=True)
    province = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    city_obj = relationship("City", back_populates="attractions")
    schedules = relationship("Schedule", back_populates="attraction")

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

class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True)
    city = Column(String(50), index=True)
    address = Column(String(500))
    latitude = Column(Float)
    longitude = Column(Float)
    
    category = Column(String(50))
    cuisine_type = Column(String(100))
    price_level = Column(Integer, default=2)
    avg_cost_per_person = Column(Float)
    
    rating = Column(Float, default=0.0)
    popularity = Column(Integer, default=0)
    
    open_time = Column(String(10), default="10:00")
    close_time = Column(String(10), default="22:00")
    closed_days = Column(String(20), default="")
    
    specialty_dishes = Column(Text)
    suitable_for = Column(Text)
    tags = Column(Text)
    
    phone = Column(String(50), nullable=True)
    image_url = Column(String(500), nullable=True)
    
    tips = Column(Text, nullable=True)
