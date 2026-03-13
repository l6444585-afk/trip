"""
PostgreSQL 数据库配置模块
支持从 SQLite 平滑迁移到 PostgreSQL
"""
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite").lower()

if DATABASE_TYPE == "postgresql":
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/travel_planner"
    )
    engine = create_engine(
        DATABASE_URL,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_pre_ping=True,
        echo=settings.DEBUG
    )
    logger.info(f"使用 PostgreSQL 数据库")
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./travel_planner.db")
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.DEBUG
    )
    logger.info(f"使用 SQLite 数据库")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection() -> dict:
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("数据库连接测试成功")
        return {
            "status": "success",
            "type": DATABASE_TYPE,
            "url": DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL
        }
    except Exception as e:
        logger.error(f"数据库连接测试失败: {e}")
        return {
            "status": "error",
            "type": DATABASE_TYPE,
            "error": str(e)
        }


def get_database_info() -> dict:
    return {
        "type": DATABASE_TYPE,
        "url": DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL,
        "pool_size": settings.DATABASE_POOL_SIZE if DATABASE_TYPE == "postgresql" else 1,
        "max_overflow": settings.DATABASE_MAX_OVERFLOW if DATABASE_TYPE == "postgresql" else 0
    }
