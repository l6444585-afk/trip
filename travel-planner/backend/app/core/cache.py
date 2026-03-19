"""
API 响应缓存模块
支持内存缓存和可配置的 TTL
"""
import hashlib
import json
import time
import logging
from typing import Optional, Any, Dict, Callable
from functools import wraps
from threading import Lock
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis module not available, using memory cache only")


class RedisClient:
    def __init__(self, url: str = "redis://localhost:6379/0"):
        self._client = None
        self._enabled = False
        if REDIS_AVAILABLE:
            try:
                self._client = redis.from_url(url, decode_responses=True)
                self._client.ping()
                self._enabled = True
                logger.info("Redis connection established")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}, using memory cache only")
                self._client = None
    
    def get(self, key: str) -> Optional[Any]:
        if not self._enabled or not self._client:
            return None
        try:
            value = self._client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        if not self._enabled or not self._client:
            return False
        try:
            self._client.setex(key, ttl, json.dumps(value, default=str))
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        if not self._enabled or not self._client:
            return False
        try:
            self._client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False
    
    def is_enabled(self) -> bool:
        return self._enabled
    
    def register_script(self, script: str):
        if not self._enabled or not self._client:
            return None
        try:
            return self._client.register_script(script)
        except Exception as e:
            logger.error(f"Redis register_script error: {e}")
            return None

    def eval_async(self, script, keys: list = None, args: list = None):
        if not self._enabled or not self._client:
            return None
        try:
            return self._client.evalsha(script.sha, len(keys or []), *(keys or []), *(args or []))
        except Exception as e:
            logger.error(f"Redis eval_async error: {e}")
            return None
    
    def eval_script(self, script, keys: list = None, args: list = None):
        if not self._enabled or not self._client:
            return None
        try:
            return self._client.eval(script, len(keys or []), *(keys or []), *(args or []))
        except Exception as e:
            logger.error(f"Redis eval error: {e}")
            return None
    
    def incr(self, key: str) -> int:
        if not self._enabled or not self._client:
            return 0
        try:
            return self._client.incr(key)
        except Exception as e:
            logger.error(f"Redis incr error: {e}")
            return 0
    
    def decr(self, key: str) -> int:
        if not self._enabled or not self._client:
            return 0
        try:
            return self._client.decr(key)
        except Exception as e:
            logger.error(f"Redis decr error: {e}")
            return 0
    
    def get_client(self):
        return self._client


redis_client = RedisClient()


@dataclass
class CacheEntry:
    value: Any
    expires_at: float
    created_at: float = field(default_factory=time.time)


class MemoryCache:
    def __init__(self, default_ttl: int = 300, max_size: int = 1000):
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = Lock()
        self._default_ttl = default_ttl
        self._max_size = max_size
        self._hits = 0
        self._misses = 0
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        key_data = {
            "args": args,
            "kwargs": kwargs
        }
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        key_hash = hashlib.md5(key_str.encode()).hexdigest()
        return f"{prefix}:{key_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                self._misses += 1
                return None
            
            if time.time() > entry.expires_at:
                del self._cache[key]
                self._misses += 1
                return None
            
            self._hits += 1
            return entry.value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        with self._lock:
            if len(self._cache) >= self._max_size:
                self._evict_expired()
                if len(self._cache) >= self._max_size:
                    oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k].created_at)
                    del self._cache[oldest_key]
            
            expires_at = time.time() + (ttl or self._default_ttl)
            self._cache[key] = CacheEntry(value=value, expires_at=expires_at)
    
    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
    
    def _evict_expired(self) -> int:
        now = time.time()
        expired_keys = [k for k, v in self._cache.items() if v.expires_at < now]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        total = self._hits + self._misses
        hit_rate = self._hits / total if total > 0 else 0
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": f"{hit_rate:.2%}",
            "total_requests": total
        }


cache = MemoryCache(default_ttl=300, max_size=1000)


def cached(prefix: str, ttl: Optional[int] = None):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = cache._generate_key(prefix, *args, **kwargs)
            
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            result = func(*args, **kwargs)
            
            if result is not None:
                cache.set(cache_key, result, ttl)
            
            return result
        
        wrapper.cache_clear = lambda: cache.clear()
        wrapper.cache_stats = lambda: cache.get_stats()
        
        return wrapper
    return decorator


def cache_response(ttl: int = 300, key_prefix: str = ""):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get('request') or (args[0] if args else None)
            
            cache_key = cache._generate_key(
                key_prefix or func.__name__,
                str(getattr(request, 'url', '')),
                str(getattr(request, 'method', 'GET'))
            )
            
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            result = await func(*args, **kwargs)
            
            if result is not None:
                cache.set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str = ""):
    with cache._lock:
        if pattern:
            keys_to_delete = [k for k in cache._cache.keys() if pattern in k]
            for key in keys_to_delete:
                del cache._cache[key]
        else:
            cache._cache.clear()
