"""
安全日志工具模块
自动过滤敏感信息，防止日志泄露
"""
import logging
import re
from typing import Any, Dict, List, Optional
from functools import wraps

SENSITIVE_KEYS = [
    "password", "passwd", "pwd", "secret", "token", "api_key", "apikey",
    "access_token", "refresh_token", "auth", "authorization", "credential",
    "private_key", "privatekey", "secret_key", "secretkey", "session",
    "cookie", "jwt", "bearer", "credit_card", "creditcard", "ssn", "phone"
]

SENSITIVE_PATTERNS = [
    (r'Bearer\s+[A-Za-z0-9\-._~+/]+=*', 'Bearer ***REDACTED***'),
    (r'sk-[A-Za-z0-9]{20,}', 'sk-***REDACTED***'),
    (r'[A-Za-z0-9]{32,}', '***API_KEY_REDACTED***'),
]


def sanitize_value(value: Any, max_length: int = 100) -> str:
    if value is None:
        return "None"
    if isinstance(value, (int, float, bool)):
        return str(value)
    str_value = str(value)
    if len(str_value) > max_length:
        return str_value[:max_length] + "..."
    return str_value


def is_sensitive_key(key: str) -> bool:
    key_lower = key.lower().replace("-", "_").replace(" ", "_")
    return any(sensitive in key_lower for sensitive in SENSITIVE_KEYS)


def redact_string(text: str) -> str:
    redacted = text
    for pattern, replacement in SENSITIVE_PATTERNS:
        redacted = re.sub(pattern, replacement, redacted, flags=re.IGNORECASE)
    return redacted


def sanitize_dict(data: Dict, depth: int = 0, max_depth: int = 5) -> Dict:
    if depth > max_depth:
        return {"_truncated": "max depth exceeded"}
    
    sanitized = {}
    for key, value in data.items():
        if is_sensitive_key(key):
            sanitized[key] = "***REDACTED***"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, depth + 1, max_depth)
        elif isinstance(value, list):
            sanitized[key] = sanitize_list(value, depth + 1, max_depth)
        elif isinstance(value, str):
            sanitized[key] = redact_string(sanitize_value(value))
        else:
            sanitized[key] = sanitize_value(value)
    return sanitized


def sanitize_list(data: List, depth: int = 0, max_depth: int = 5) -> List:
    if depth > max_depth:
        return ["_truncated: max depth exceeded"]
    
    sanitized = []
    for item in data[:10]:
        if isinstance(item, dict):
            sanitized.append(sanitize_dict(item, depth + 1, max_depth))
        elif isinstance(item, list):
            sanitized.append(sanitize_list(item, depth + 1, max_depth))
        elif isinstance(item, str):
            sanitized.append(redact_string(sanitize_value(item)))
        else:
            sanitized.append(sanitize_value(item))
    
    if len(data) > 10:
        sanitized.append(f"... and {len(data) - 10} more items")
    return sanitized


class SecureLogger:
    def __init__(self, name: str, level: int = logging.INFO):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
    
    def _sanitize_args(self, *args, **kwargs) -> tuple:
        sanitized_args = []
        for arg in args:
            if isinstance(arg, dict):
                sanitized_args.append(sanitize_dict(arg))
            elif isinstance(arg, list):
                sanitized_args.append(sanitize_list(arg))
            elif isinstance(arg, str):
                sanitized_args.append(redact_string(arg))
            else:
                sanitized_args.append(arg)
        
        sanitized_kwargs = sanitize_dict(kwargs) if kwargs else {}
        return tuple(sanitized_args), sanitized_kwargs
    
    def debug(self, msg: str, *args, **kwargs):
        sanitized_args, sanitized_kwargs = self._sanitize_args(*args, **kwargs)
        self.logger.debug(msg, *sanitized_args, **sanitized_kwargs)
    
    def info(self, msg: str, *args, **kwargs):
        sanitized_args, sanitized_kwargs = self._sanitize_args(*args, **kwargs)
        self.logger.info(msg, *sanitized_args, **sanitized_kwargs)
    
    def warning(self, msg: str, *args, **kwargs):
        sanitized_args, sanitized_kwargs = self._sanitize_args(*args, **kwargs)
        self.logger.warning(msg, *sanitized_args, **sanitized_kwargs)
    
    def error(self, msg: str, *args, **kwargs):
        sanitized_args, sanitized_kwargs = self._sanitize_args(*args, **kwargs)
        self.logger.error(msg, *sanitized_args, **sanitized_kwargs)
    
    def critical(self, msg: str, *args, **kwargs):
        sanitized_args, sanitized_kwargs = self._sanitize_args(*args, **kwargs)
        self.logger.critical(msg, *sanitized_args, **sanitized_kwargs)
    
    def exception(self, msg: str, *args, **kwargs):
        sanitized_args, sanitized_kwargs = self._sanitize_args(*args, **kwargs)
        self.logger.exception(msg, *sanitized_args, **sanitized_kwargs)


def get_secure_logger(name: str, level: int = logging.INFO) -> SecureLogger:
    return SecureLogger(name, level)


def secure_log(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        sanitized_args = []
        for arg in args:
            if isinstance(arg, dict):
                sanitized_args.append(sanitize_dict(arg))
            elif isinstance(arg, str):
                sanitized_args.append(redact_string(arg))
            else:
                sanitized_args.append(arg)
        return func(*sanitized_args, **kwargs)
    return wrapper
