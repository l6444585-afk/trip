"""
统一配置管理模块
所有配置项通过环境变量加载，支持类型验证和默认值
"""
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Optional, List
from functools import lru_cache
import secrets


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": False, "extra": "ignore"}

    APP_NAME: str = "江浙沪旅游行程规划系统"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development", pattern=r"^(development|staging|production)$")

    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    DATABASE_URL: str = "sqlite:///./travel_planner.db"
    ENHANCED_DATABASE_URL: str = "sqlite:///./travel_planner_enhanced.db"
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    GLM_API_KEY: Optional[str] = None
    GLM_MODEL: str = "glm-4-flash"
    GLM_MAX_TOKENS: int = 4000
    GLM_TEMPERATURE: float = 0.7

    SILICONFLOW_API_KEY: Optional[str] = None
    SILICONFLOW_BASE_URL: str = "https://api.siliconflow.cn/v1"
    SILICONFLOW_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"

    AMAP_API_KEY: Optional[str] = None

    FRONTEND_URL: str = "http://localhost:3000"

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    CACHE_TTL: int = 3600
    SESSION_MAX_AGE: int = 86400
    MAX_SESSIONS: int = 1000

    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "app.log"
    LOG_DIR: str = "logs"

    DEMO_USER_ENABLED: bool = True
    DEMO_USER_USERNAME: str = "admin"
    DEMO_USER_PASSWORD: str = "admin123"

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if v in ["your-secret-key-here", "your-secret-key-here-change-this-in-production", "change-me"]:
            if cls.model_config.get("env_file"):
                import warnings
                warnings.warn("使用默认 SECRET_KEY，请在生产环境中设置安全密钥！")
            return secrets.token_urlsafe(32)
        return v

    @field_validator("GLM_API_KEY", "SILICONFLOW_API_KEY", "AMAP_API_KEY")
    @classmethod
    def validate_api_keys(cls, v: Optional[str]) -> Optional[str]:
        if v and v.startswith("your_"):
            return None
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def effective_cors_origins(self) -> List[str]:
        if self.is_development:
            return ["*"]
        return self.CORS_ORIGINS

    def get_ai_provider(self) -> str:
        if self.GLM_API_KEY:
            return "zhipu"
        elif self.SILICONFLOW_API_KEY:
            return "siliconflow"
        return "mock"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
