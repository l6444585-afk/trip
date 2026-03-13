import bcrypt
import re
import secrets
import time
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User
import os
from collections import defaultdict
from threading import Lock

SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

login_attempts: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"count": 0, "lock_until": 0})
login_lock = Lock()

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

class UserLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=1)
    remember_me: bool = False
    
    @field_validator('username')
    @classmethod
    def sanitize_username(cls, v: str) -> str:
        sanitized = re.sub(r'[<>"\'\\;]', '', v.strip())
        if not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fa5]+$', sanitized):
            raise ValueError('用户名只能包含字母、数字、下划线和中文')
        return sanitized
    
    @field_validator('password')
    @classmethod
    def sanitize_password(cls, v: str) -> str:
        if len(v) > 128:
            raise ValueError('密码长度不能超过128个字符')
        return v

class UserRegister(BaseModel):
    username: str = Field(..., max_length=50)
    password: str = Field(..., max_length=128)
    confirm_password: str = Field(..., max_length=128)
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        sanitized = re.sub(r'[<>"\'\\;]', '', v.strip())
        if not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fa5]+$', sanitized):
            raise ValueError('用户名只能包含字母、数字、下划线和中文')
        return sanitized
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) > 128:
            raise ValueError('密码长度不能超过128个字符')
        return v
    
    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('两次输入的密码不一致')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    expires_in: int

class PasswordStrengthResult(BaseModel):
    is_valid: bool
    score: int
    message: str
    suggestions: list[str] = []

def check_password_strength(password: str) -> PasswordStrengthResult:
    score = 0
    suggestions = []
    
    if len(password) >= 8:
        score += 1
    else:
        suggestions.append("密码至少需要8个字符")
        return PasswordStrengthResult(
            is_valid=False,
            score=score,
            message="密码长度不足，至少需要8个字符",
            suggestions=suggestions
        )
    
    if len(password) >= 12:
        score += 1
    
    if re.search(r'[a-z]', password):
        score += 1
    else:
        suggestions.append("建议添加小写字母")
    
    if re.search(r'[A-Z]', password):
        score += 1
    else:
        suggestions.append("建议添加大写字母")
    
    if re.search(r'[0-9]', password):
        score += 1
    else:
        suggestions.append("建议添加数字")
    
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1
    else:
        suggestions.append("建议添加特殊字符")
    
    common_patterns = [
        r'123456', r'password', r'qwerty', r'abc123',
        r'111111', r'000000', r'1234567890'
    ]
    for pattern in common_patterns:
        if re.search(pattern, password.lower()):
            score = max(0, score - 2)
            suggestions.append("避免使用常见密码模式")
            break
    
    if score >= 5:
        return PasswordStrengthResult(
            is_valid=True,
            score=score,
            message="密码强度：非常强",
            suggestions=[]
        )
    elif score >= 4:
        return PasswordStrengthResult(
            is_valid=True,
            score=score,
            message="密码强度：强",
            suggestions=[]
        )
    elif score >= 3:
        return PasswordStrengthResult(
            is_valid=True,
            score=score,
            message="密码强度：中等",
            suggestions=suggestions
        )
    else:
        return PasswordStrengthResult(
            is_valid=False,
            score=score,
            message="密码强度不足，请设置更复杂的密码",
            suggestions=suggestions
        )

def check_login_attempts(username: str) -> tuple[bool, int]:
    with login_lock:
        current_time = time.time()
        attempts = login_attempts[username]
        
        if attempts["lock_until"] > current_time:
            remaining = int((attempts["lock_until"] - current_time) / 60) + 1
            return False, remaining
        
        return True, 0

def record_login_attempt(username: str, success: bool) -> None:
    with login_lock:
        current_time = time.time()
        
        if success:
            login_attempts[username] = {"count": 0, "lock_until": 0}
        else:
            attempts = login_attempts[username]
            
            if attempts["lock_until"] > current_time:
                return
            
            attempts["count"] += 1
            
            if attempts["count"] >= MAX_LOGIN_ATTEMPTS:
                attempts["lock_until"] = current_time + (LOCKOUT_DURATION_MINUTES * 60)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": secrets.token_urlsafe(16),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": secrets.token_urlsafe(16),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据，请重新登录",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if username is None or token_type != "access":
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登录已过期，请重新登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except jwt.PyJWTError:
        return None
    
    user = db.query(User).filter(User.username == username).first()
    return user

def sanitize_input(text: str, max_length: int = 1000) -> str:
    sanitized = re.sub(r'[<>"\'\\;]', '', text.strip())
    return sanitized[:max_length]

def validate_username_format(username: str) -> tuple[bool, str]:
    if not username:
        return False, "用户名不能为空"
    
    if len(username) < 3:
        return False, "用户名至少3个字符"
    
    if len(username) > 50:
        return False, "用户名不能超过50个字符"
    
    if not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fa5]+$', username):
        return False, "用户名只能包含字母、数字、下划线和中文"
    
    dangerous_patterns = ['admin', 'root', 'system', 'test', 'user']
    if username.lower() in dangerous_patterns:
        return False, "该用户名已被系统保留"
    
    return True, "用户名格式正确"
