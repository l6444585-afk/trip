"""
数据库会话管理模块
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from typing import Generator, Optional
from contextlib import contextmanager
import os
from pathlib import Path

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

Base = declarative_base()


class DatabaseManager:
    """数据库管理器"""

    def __init__(
        self,
        database_url: str,
        pool_size: int = 5,
        max_overflow: int = 10,
        echo: bool = False
    ):
        self.database_url = database_url
        self.echo = echo

        is_sqlite = "sqlite" in database_url

        engine_kwargs = {
            "echo": echo,
            "pool_pre_ping": True,
        }

        if not is_sqlite:
            engine_kwargs.update({
                "pool_size": pool_size,
                "max_overflow": max_overflow,
            })
        else:
            engine_kwargs["connect_args"] = {"check_same_thread": False}

        self.engine = create_engine(database_url, **engine_kwargs)

        if is_sqlite:
            @event.listens_for(self.engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA synchronous=NORMAL")
                cursor.execute("PRAGMA cache_size=1000")
                cursor.close()

        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )

        logger.info(f"数据库引擎初始化完成: {database_url.split('://')[0]}")

    def create_tables(self):
        """创建所有表"""
        Base.metadata.create_all(bind=self.engine)
        logger.info("数据库表创建完成")

    def drop_tables(self):
        """删除所有表"""
        Base.metadata.drop_all(bind=self.engine)
        logger.info("数据库表删除完成")

    def get_session(self) -> Generator[Session, None, None]:
        """获取数据库会话"""
        session = self.SessionLocal()
        try:
            yield session
        finally:
            session.close()

    @contextmanager
    def session_scope(self) -> Generator[Session, None, None]:
        """会话上下文管理器"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"数据库事务回滚: {e}")
            raise
        finally:
            session.close()


primary_db = DatabaseManager(
    database_url=settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    echo=settings.DEBUG
)

enhanced_db = DatabaseManager(
    database_url=settings.ENHANCED_DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    echo=settings.DEBUG
)


def get_db() -> Generator[Session, None, None]:
    """获取主数据库会话（依赖注入）"""
    yield from primary_db.get_session()


def get_enhanced_db() -> Generator[Session, None, None]:
    """获取增强数据库会话（依赖注入）"""
    yield from enhanced_db.get_session()


def init_db():
    """初始化数据库"""
    primary_db.create_tables()
    enhanced_db.create_tables()
    logger.info("数据库初始化完成")


def init_enhanced_db():
    """初始化增强数据库"""
    enhanced_db.create_tables()
    logger.info("增强数据库初始化完成")
