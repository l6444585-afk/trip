from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import hashlib
import json

class CacheManager:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._default_ttl = 3600
    
    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> None:
        expires_at = datetime.now() + timedelta(seconds=ttl or self._default_ttl)
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at
        }
    
    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        
        cache_item = self._cache[key]
        
        if datetime.now() > cache_item['expires_at']:
            del self._cache[key]
            return None
        
        return cache_item['value']
    
    def delete(self, key: str) -> bool:
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def clear(self) -> None:
        self._cache.clear()
    
    def cleanup_expired(self) -> int:
        now = datetime.now()
        expired_keys = [
            key for key, item in self._cache.items()
            if now > item['expires_at']
        ]
        
        for key in expired_keys:
            del self._cache[key]
        
        return len(expired_keys)
    
    def generate_key(self, *args, **kwargs) -> str:
        key_data = {
            'args': args,
            'kwargs': sorted(kwargs.items())
        }
        key_str = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()

cache_manager = CacheManager()

def cached(ttl: int = 3600):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            cache_key = cache_manager.generate_key(func.__name__, *args, **kwargs)
            
            cached_result = cache_manager.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            result = await func(*args, **kwargs)
            cache_manager.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator
