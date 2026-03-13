import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import get_db, Base
from models import User
from auth_utils import get_password_hash, verify_password, create_access_token
from main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def test_password_hashing():
    password = "test_password_123"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_create_access_token():
    token = create_access_token(data={"sub": "test_user"})
    
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0

def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
            "confirm_password": "password123"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["username"] == "testuser"

def test_login_user(client, db_session):
    hashed_password = get_password_hash("password123")
    user = User(username="testuser", email="test@example.com", password=hashed_password)
    db_session.add(user)
    db_session.commit()
    
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "password123"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user" in data

def test_login_with_wrong_password(client, db_session):
    hashed_password = get_password_hash("password123")
    user = User(username="testuser", email="test@example.com", password=hashed_password)
    db_session.add(user)
    db_session.commit()
    
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "wrong_password"
        }
    )
    
    assert response.status_code == 401
    assert "用户名或密码错误" in response.json()["detail"]

def test_register_duplicate_email(client, db_session):
    hashed_password = get_password_hash("password123")
    user = User(username="testuser", email="test@example.com", password=hashed_password)
    db_session.add(user)
    db_session.commit()
    
    response = client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "test@example.com",
            "password": "password123",
            "confirm_password": "password123"
        }
    )
    
    assert response.status_code == 400
    assert "邮箱已被注册" in response.json()["detail"]
