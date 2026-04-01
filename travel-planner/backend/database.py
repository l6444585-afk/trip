from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base as LegacyBase
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR.as_posix()}/travel_planner.db")
ENHANCED_DATABASE_URL = os.getenv("ENHANCED_DATABASE_URL", f"sqlite:///{BASE_DIR.as_posix()}/travel_planner_enhanced.db")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

enhanced_engine = create_engine(
    ENHANCED_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in ENHANCED_DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
EnhancedSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=enhanced_engine)

def init_db():
    LegacyBase.metadata.create_all(bind=engine)

def init_enhanced_db():
    from enhanced_models import Base as EnhancedBase
    EnhancedBase.metadata.create_all(bind=enhanced_engine)

def init_admin_db():
    from admin_models import Base as AdminBase
    AdminBase.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_enhanced_db():
    db = EnhancedSessionLocal()
    try:
        yield db
    finally:
        db.close()
