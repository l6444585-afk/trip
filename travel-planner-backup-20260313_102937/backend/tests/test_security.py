"""
安全性测试
测试注入攻击、XSS、暴力破解防护等安全措施
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
from auth_utils import get_password_hash, login_attempts, login_lock
from database import get_db

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
    with login_lock:
        login_attempts.clear()
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(setup_db):
    db = TestingSessionLocal()
    user = User(
        username="secureuser",
        email="secureuser@travel.local",
        password=get_password_hash("SecurePass123!")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


class TestSQLInjection:
    """SQL注入测试"""
    
    def test_sql_injection_in_username(self, test_user):
        """测试用户名SQL注入"""
        malicious_usernames = [
            "admin'--",
            "admin' OR '1'='1",
            "' OR 1=1--",
        ]
        
        with TestClient(app) as client:
            for username in malicious_usernames:
                response = client.post(
                    "/api/auth/login",
                    json={
                        "username": username,
                        "password": "anypassword"
                    }
                )
                assert response.status_code in [401, 422]
    
    def test_sql_injection_in_register(self, setup_db):
        """测试注册SQL注入"""
        malicious_usernames = [
            "test'; DROP TABLE users;--",
            "admin' OR '1'='1'--",
        ]
        
        with TestClient(app) as client:
            for username in malicious_usernames:
                response = client.post(
                    "/api/auth/register",
                    json={
                        "username": username,
                        "password": "SecurePass123!",
                        "confirm_password": "SecurePass123!"
                    }
                )
                assert response.status_code == 422


class TestXSSProtection:
    """XSS防护测试"""
    
    def test_xss_in_username(self, setup_db):
        """测试用户名XSS"""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert('xss')>",
        ]
        
        with TestClient(app) as client:
            for payload in xss_payloads:
                response = client.post(
                    "/api/auth/register",
                    json={
                        "username": payload,
                        "password": "SecurePass123!",
                        "confirm_password": "SecurePass123!"
                    }
                )
                assert response.status_code == 422


class TestBruteForceProtection:
    """暴力破解防护测试"""
    
    def test_login_lockout_after_max_attempts(self, test_user):
        """测试多次失败后锁定"""
        with TestClient(app) as client:
            for i in range(5):
                response = client.post(
                    "/api/auth/login",
                    json={
                        "username": "secureuser",
                        "password": f"WrongPass{i}!"
                    }
                )
                assert response.status_code == 401
            
            response = client.post(
                "/api/auth/login",
                json={
                    "username": "secureuser",
                    "password": "SecurePass123!"
                }
            )
            assert response.status_code == 429
            assert "分钟" in response.json()["detail"]
    
    def test_different_users_independent_lockout(self, test_user, setup_db):
        """测试不同用户独立锁定"""
        db = TestingSessionLocal()
        user2 = User(
            username="anotheruser",
            email="another@travel.local",
            password=get_password_hash("SecurePass123!")
        )
        db.add(user2)
        db.commit()
        db.close()
        
        with TestClient(app) as client:
            for _ in range(5):
                client.post(
                    "/api/auth/login",
                    json={
                        "username": "secureuser",
                        "password": "WrongPassword!"
                    }
                )
            
            response = client.post(
                "/api/auth/login",
                json={
                    "username": "anotheruser",
                    "password": "SecurePass123!"
                }
            )
            assert response.status_code == 200


class TestInputValidation:
    """输入验证测试"""
    
    def test_empty_username(self, setup_db):
        """测试空用户名"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/login",
                json={
                    "username": "",
                    "password": "password123"
                }
            )
            assert response.status_code == 422
    
    def test_empty_password(self, setup_db):
        """测试空密码"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/login",
                json={
                    "username": "testuser",
                    "password": ""
                }
            )
            assert response.status_code == 422
    
    def test_extremely_long_username(self, setup_db):
        """测试超长用户名"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/login",
                json={
                    "username": "a" * 1000,
                    "password": "password123"
                }
            )
            assert response.status_code == 422


class TestTokenSecurity:
    """令牌安全测试"""
    
    def test_expired_token_rejected(self, setup_db):
        """测试过期令牌被拒绝"""
        with TestClient(app) as client:
            response = client.get(
                "/api/auth/me",
                headers={"Authorization": "Bearer expired_token"}
            )
            assert response.status_code == 401
    
    def test_malformed_token_rejected(self, setup_db):
        """测试格式错误的令牌被拒绝"""
        malformed_tokens = ["", "null", "invalid.token"]
        
        with TestClient(app) as client:
            for token in malformed_tokens:
                response = client.get(
                    "/api/auth/me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 401


class TestPasswordSecurity:
    """密码安全测试"""
    
    def test_password_not_returned_in_response(self, test_user):
        """测试密码不在响应中返回"""
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/login",
                json={
                    "username": "secureuser",
                    "password": "SecurePass123!"
                }
            )
            data = response.json()
            assert "password" not in data
            assert "password" not in data.get("user", {})
    
    def test_common_passwords_rejected(self, setup_db):
        """测试常见密码被拒绝"""
        common_passwords = ["123456", "password", "qwerty"]
        
        with TestClient(app) as client:
            for password in common_passwords:
                response = client.post(
                    "/api/auth/register",
                    json={
                        "username": "testuser123",
                        "password": password,
                        "confirm_password": password
                    }
                )
                assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
