"""
缓存工具模块
提供内存缓存和Redis缓存支持
"""
from typing import Dict, Any, Optional, Callable, TypeVar, List, Tuple
from datetime import datetime, timedelta
from functools import wraps, lru_cache
from collections import OrderedDict
import hashlib
import json
import asyncio
from app.core.logging import get_logger

logger = get_logger(__name__)

T = TypeVar('T')


class CacheItem:
    """缓存项"""
    def __init__(self, value: Any, ttl: int):
        self.value = value
        self.expires_at = datetime.now() + timedelta(seconds=ttl)
        self.created_at = datetime.now()
        self.access_count = 0

    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at

    def touch(self):
        self.access_count += 1


class LRUCache:
    """LRU缓存实现"""

    def __init__(self, max_size: int = 1000, default_ttl: int = 3600):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: OrderedDict[str, CacheItem] = OrderedDict()
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        async with self._lock:
            if key not in self._cache:
                return None

            item = self._cache[key]

            if item.is_expired():
                del self._cache[key]
                return None

            self._cache.move_to_end(key)
            item.touch()
            return item.value

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """设置缓存值"""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]

            while len(self._cache) >= self.max_size:
                self._cache.popitem(last=False)

            self._cache[key] = CacheItem(value, ttl or self.default_ttl)

    async def delete(self, key: str) -> bool:
        """删除缓存值"""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    async def clear(self) -> None:
        """清空缓存"""
        async with self._lock:
            self._cache.clear()

    async def cleanup_expired(self) -> int:
        """清理过期缓存"""
        async with self._lock:
            expired_keys = [
                key for key, item in self._cache.items()
                if item.is_expired()
            ]

            for key in expired_keys:
                del self._cache[key]

            if expired_keys:
                logger.debug(f"清理了 {len(expired_keys)} 个过期缓存项")

            return len(expired_keys)

    def stats(self) -> Dict[str, Any]:
        """获取缓存统计"""
        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "items": [
                {
                    "key": k,
                    "created_at": v.created_at.isoformat(),
                    "access_count": v.access_count
                }
                for k, v in list(self._cache.items())[:10]
            ]
        }


class CacheManager:
    """缓存管理器"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._caches: Dict[str, LRUCache] = {}
            cls._instance._default_ttl = 3600
        return cls._instance

    def get_cache(self, name: str, max_size: int = 1000, ttl: int = 3600) -> LRUCache:
        """获取或创建命名缓存"""
        if name not in self._caches:
            self._caches[name] = LRUCache(max_size=max_size, default_ttl=ttl)
        return self._caches[name]

    async def get(self, cache_name: str, key: str) -> Optional[Any]:
        """获取缓存值"""
        cache = self.get_cache(cache_name)
        return await cache.get(key)

    async def set(
        self,
        cache_name: str,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> None:
        """设置缓存值"""
        cache = self.get_cache(cache_name)
        await cache.set(key, value, ttl)

    async def delete(self, cache_name: str, key: str) -> bool:
        """删除缓存值"""
        cache = self.get_cache(cache_name)
        return await cache.delete(key)

    async def clear(self, cache_name: str) -> None:
        """清空指定缓存"""
        cache = self.get_cache(cache_name)
        await cache.clear()

    async def clear_all(self) -> None:
        """清空所有缓存"""
        for cache in self._caches.values():
            await cache.clear()

    @staticmethod
    def generate_key(*args, **kwargs) -> str:
        """生成缓存键"""
        key_data = {
            "args": [str(a) for a in args],
            "kwargs": {k: str(v) for k, v in sorted(kwargs.items())}
        }
        key_str = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()


def cached(
    cache_name: str = "default",
    ttl: int = 3600,
    key_prefix: str = ""
):
    """
    缓存装饰器

    Args:
        cache_name: 缓存名称
        ttl: 过期时间（秒）
        key_prefix: 键前缀
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            cache_manager = CacheManager()
            cache_key = f"{key_prefix}:{CacheManager.generate_key(func.__name__, *args, **kwargs)}"

            cached_result = await cache_manager.get(cache_name, cache_key)
            if cached_result is not None:
                logger.debug(f"缓存命中: {cache_key}")
                return cached_result

            result = await func(*args, **kwargs)

            await cache_manager.set(cache_name, cache_key, result, ttl)
            logger.debug(f"缓存设置: {cache_key}")

            return result

        return wrapper

    return decorator


cache_manager = CacheManager()
