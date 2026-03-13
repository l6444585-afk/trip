"""
Redis 缓存服务模块
提供分布式缓存能力，支持多种缓存策略
"""
import os
import json
import logging
import hashlib
from typing import Optional, Any, Dict, List, Union
from datetime import timedelta
from dataclasses import dataclass
import time

logger = logging.getLogger(__name__)

REDIS_ENABLED = os.getenv("REDIS_ENABLED", "false").lower() == "true"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

if REDIS_ENABLED:
    try:
        import redis
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        logger.info(f"Redis 缓存已启用: {REDIS_URL}")
    except ImportError:
        logger.warning("Redis 库未安装，使用内存缓存")
        REDIS_ENABLED = False
        redis_client = None
    except Exception as e:
        logger.warning(f"Redis 连接失败: {e}，使用内存缓存")
        REDIS_ENABLED = False
        redis_client = None
else:
    redis_client = None
    logger.info("使用内存缓存")


@dataclass
class CacheConfig:
    default_ttl: int = 3600
    max_memory_items: int = 1000
    key_prefix: str = "travel_planner"


class MemoryCacheBackend:
    def __init__(self, config: CacheConfig = None):
        self.config = config or CacheConfig()
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._access_times: Dict[str, float] = {}
    
    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        if entry["expires_at"] < time.time():
            del self._cache[key]
            del self._access_times[key]
            return None
        
        self._access_times[key] = time.time()
        return entry["value"]
    
    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        ttl = ttl or self.config.default_ttl
        
        if len(self._cache) >= self.config.max_memory_items:
            self._evict_lru()
        
        self._cache[key] = {
            "value": value,
            "expires_at": time.time() + ttl,
            "created_at": time.time()
        }
        self._access_times[key] = time.time()
        return True
    
    def delete(self, key: str) -> bool:
        if key in self._cache:
            del self._cache[key]
            del self._access_times[key]
            return True
        return False
    
    def exists(self, key: str) -> bool:
        return key in self._cache and self._cache[key]["expires_at"] >= time.time()
    
    def clear(self) -> bool:
        self._cache.clear()
        self._access_times.clear()
        return True
    
    def _evict_lru(self):
        if not self._access_times:
            return
        
        lru_key = min(self._access_times, key=self._access_times.get)
        self.delete(lru_key)
    
    def get_stats(self) -> Dict[str, Any]:
        now = time.time()
        valid_count = sum(
            1 for entry in self._cache.values()
            if entry["expires_at"] >= now
        )
        return {
            "type": "memory",
            "total_items": len(self._cache),
            "valid_items": valid_count,
            "max_items": self.config.max_memory_items
        }


class RedisCacheBackend:
    def __init__(self, client, config: CacheConfig = None):
        self.client = client
        self.config = config or CacheConfig()
    
    def get(self, key: str) -> Optional[Any]:
        try:
            value = self.client.get(key)
            if value is None:
                return None
            return json.loads(value)
        except Exception as e:
            logger.error(f"Redis get 错误: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        try:
            ttl = ttl or self.config.default_ttl
            serialized = json.dumps(value, ensure_ascii=False, default=str)
            return self.client.setex(key, ttl, serialized)
        except Exception as e:
            logger.error(f"Redis set 错误: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            logger.error(f"Redis delete 错误: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Redis exists 错误: {e}")
            return False
    
    def clear(self) -> bool:
        try:
            self.client.flushdb()
            return True
        except Exception as e:
            logger.error(f"Redis clear 错误: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        try:
            info = self.client.info()
            return {
                "type": "redis",
                "used_memory": info.get("used_memory_human", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "total_keys": self.client.dbsize()
            }
        except Exception as e:
            return {"type": "redis", "error": str(e)}


class CacheService:
    def __init__(self, config: CacheConfig = None):
        self.config = config or CacheConfig()
        
        if REDIS_ENABLED and redis_client:
            self.backend = RedisCacheBackend(redis_client, self.config)
            self.type = "redis"
        else:
            self.backend = MemoryCacheBackend(self.config)
            self.type = "memory"
    
    def _make_key(self, key: str) -> str:
        return f"{self.config.key_prefix}:{key}"
    
    def get(self, key: str) -> Optional[Any]:
        full_key = self._make_key(key)
        return self.backend.get(full_key)
    
    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        full_key = self._make_key(key)
        return self.backend.set(full_key, value, ttl)
    
    def delete(self, key: str) -> bool:
        full_key = self._make_key(key)
        return self.backend.delete(full_key)
    
    def exists(self, key: str) -> bool:
        full_key = self._make_key(key)
        return self.backend.exists(full_key)
    
    def clear(self) -> bool:
        return self.backend.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        return self.backend.get_stats()
    
    def get_or_set(self, key: str, callable_func, ttl: int = None) -> Any:
        value = self.get(key)
        if value is not None:
            return value
        
        value = callable_func() if callable(callable_func) else callable_func
        self.set(key, value, ttl)
        return value
    
    async def get_or_set_async(self, key: str, async_func, ttl: int = None) -> Any:
        value = self.get(key)
        if value is not None:
            return value
        
        value = await async_func()
        self.set(key, value, ttl)
        return value
    
    def invalidate_pattern(self, pattern: str) -> int:
        count = 0
        if self.type == "redis":
            keys = redis_client.keys(f"{self.config.key_prefix}:{pattern}*")
            if keys:
                count = redis_client.delete(*keys)
        return count


cache_service = CacheService()


def get_cache() -> CacheService:
    return cache_service
