"""
认证系统集成测试
测试登录、注册API端点
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Base
from main import app
from models import User
from auth_utils import get_password_hash
from database import get_db, SessionLocal

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(setup_db):
    db = TestingSessionLocal()
    user = User(
        username="testuser",
        email="testuser@travel.local",
        password=get_password_hash("TestPass123!")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


class TestRegisterAPI:
    """注册API测试"""
    
    def test_register_success(self, setup_db):
        """测试成功注册"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/register",
                json={
                    "username": "newuser",
                    "password": "SecurePass123!",
                    "confirm_password": "SecurePass123!"
                }
            )
            assert response.status_code == 201
            data = response.json()
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["user"]["username"] == "newuser"
    
    def test_register_duplicate_username(self, test_user):
        """测试重复用户名注册"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/register",
                json={
                    "username": "testuser",
                    "password": "SecurePass123!",
                    "confirm_password": "SecurePass123!"
                }
            )
            assert response.status_code == 400
            assert "已被使用" in response.json()["detail"]
    
    def test_register_weak_password(self, setup_db):
        """测试弱密码注册"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/register",
                json={
                    "username": "newuser",
                    "password": "123456",
                    "confirm_password": "123456"
                }
            )
            assert response.status_code == 422


class TestLoginAPI:
    """登录API测试"""
    
    def test_login_success(self, test_user):
        """测试成功登录"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/login",
                json={
                    "username": "testuser",
                    "password": "TestPass123!"
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["user"]["username"] == "testuser"
    
    def test_login_with_remember_me(self, test_user):
        """测试记住我登录"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/login",
                json={
                    "username": "testuser",
                    "password": "TestPass123!",
                    "remember_me": True
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert data["expires_in"] == 604800
    
    def test_login_wrong_password(self, test_user):
        """测试错误密码登录"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/login",
                json={
                    "username": "testuser",
                    "password": "WrongPassword123!"
                }
            )
            assert response.status_code == 401
    
    def test_login_nonexistent_user(self, setup_db):
        """测试不存在的用户登录"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/login",
                json={
                    "username": "nonexistent",
                    "password": "SomePassword123!"
                }
            )
            assert response.status_code == 401


class TestCheckUsernameAPI:
    """用户名检查API测试"""
    
    def test_check_username_available(self, setup_db):
        """测试可用用户名"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/check-username?username=newuser"
            )
            assert response.status_code == 200
            data = response.json()
            assert data["available"] == True
    
    def test_check_username_taken(self, test_user):
        """测试已占用用户名"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/check-username?username=testuser"
            )
            assert response.status_code == 200
            data = response.json()
            assert data["available"] == False


class TestCheckPasswordAPI:
    """密码强度检查API测试"""
    
    def test_check_strong_password(self, setup_db):
        """测试强密码"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/check-password?password=SecurePass123!"
            )
            assert response.status_code == 200
            data = response.json()
            assert data["is_valid"] == True
            assert data["score"] >= 4
    
    def test_check_weak_password(self, setup_db):
        """测试弱密码"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/check-password?password=123456"
            )
            assert response.status_code == 200
            data = response.json()
            assert data["is_valid"] == False


class TestRefreshTokenAPI:
    """刷新令牌API测试"""
    
    def test_refresh_token_success(self, test_user):
        """测试成功刷新令牌"""
        with TestClient(app) as client:
            login_response = client.post(
                "/api/auth/login",
                json={
                    "username": "testuser",
                    "password": "TestPass123!"
                }
            )
            refresh_token = login_response.json()["refresh_token"]
            
            response = client.post(
                "/api/auth/refresh?refresh_token=" + refresh_token
            )
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
    
    def test_refresh_token_invalid(self, setup_db):
        """测试无效刷新令牌"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/refresh?refresh_token=invalid_token"
            )
            assert response.status_code == 401


class TestGetCurrentUser:
    """获取当前用户测试"""
    
    def test_get_current_user_success(self, test_user):
        """测试成功获取当前用户"""
        with TestClient(app) as client:
            login_response = client.post(
                "/api/auth/login",
                json={
                    "username": "testuser",
                    "password": "TestPass123!"
                }
            )
            token = login_response.json()["access_token"]
            
            response = client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["username"] == "testuser"
    
    def test_get_current_user_invalid_token(self, setup_db):
        """测试无效令牌获取用户"""
        with TestClient(app) as client:
            response = client.get(
                "/api/auth/me",
                headers={"Authorization": "Bearer invalid_token"}
            )
            assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
