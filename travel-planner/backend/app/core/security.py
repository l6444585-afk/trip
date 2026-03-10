"""
安全模块
处理密码哈希、JWT令牌生成与验证
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import secrets

from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


class SecurityManager:
    """安全管理器"""

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """生成密码哈希"""
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None,
        secret_key: Optional[str] = None,
        algorithm: Optional[str] = None
    ) -> str:
        """创建访问令牌"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": secrets.token_urlsafe(16)
        })
        
        encoded_jwt = jwt.encode(
            to_encode,
            secret_key or settings.SECRET_KEY,
            algorithm=algorithm or settings.ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def decode_token(
        token: str,
        secret_key: Optional[str] = None,
        algorithm: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """解码令牌"""
        try:
            payload = jwt.decode(
                token,
                secret_key or settings.SECRET_KEY,
                algorithms=[algorithm or settings.ALGORITHM]
            )
            return payload
        except JWTError:
            return None

    @staticmethod
    def create_refresh_token(
        data: Dict[str, Any],
        expires_days: int = 7
    ) -> str:
        """创建刷新令牌"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=expires_days)
        to_encode.update({
            "exp": expire,
            "type": "refresh"
        })
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def generate_api_key() -> str:
        """生成API密钥"""
        return secrets.token_urlsafe(32)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(lambda: None)
) -> Optional[Dict[str, Any]]:
    """获取当前用户（可选）"""
    if not token:
        return None
    
    payload = SecurityManager.decode_token(token)
    if not payload:
        return None
    
    username: str = payload.get("sub")
    if not username:
        return None
    
    return {
        "username": username,
        "user_id": payload.get("user_id"),
        "exp": payload.get("exp")
    }


async def get_current_user_required(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(lambda: None)
) -> Dict[str, Any]:
    """获取当前用户（必须认证）"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    payload = SecurityManager.decode_token(token)
    if not payload:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if not username:
        raise credentials_exception
    
    return {
        "username": username,
        "user_id": payload.get("user_id"),
        "exp": payload.get("exp")
    }
