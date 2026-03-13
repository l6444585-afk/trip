"""
认证系统单元测试
测试登录、注册、密码强度检测等功能
"""

import pytest
from datetime import datetime, timedelta
from auth_utils import (
    UserLogin, UserRegister, Token, PasswordStrengthResult,
    check_password_strength, verify_password, get_password_hash,
    create_access_token, create_refresh_token, verify_token,
    validate_username_format, sanitize_input,
    check_login_attempts, record_login_attempt,
    login_attempts, login_lock
)


class TestPasswordStrength:
    """密码强度检测测试"""
    
    def test_weak_password(self):
        """测试弱密码"""
        result = check_password_strength("123456")
        assert result.is_valid == False
        assert result.score < 3
    
    def test_medium_password(self):
        """测试中等强度密码"""
        result = check_password_strength("Password123!")
        assert result.is_valid == True
        assert result.score >= 3
    
    def test_strong_password(self):
        """测试强密码"""
        result = check_password_strength("SecurePass123!")
        assert result.is_valid == True
        assert result.score >= 4
    
    def test_very_strong_password(self):
        """测试非常强的密码"""
        result = check_password_strength("VerySecurePassword123!@#XyZ")
        assert result.is_valid == True
        assert result.score >= 4
    
    def test_common_password_pattern(self):
        """测试常见密码模式"""
        result = check_password_strength("password123456")
        assert result.is_valid == False or result.score < 3
    
    def test_short_password(self):
        """测试短密码"""
        result = check_password_strength("Ab1")
        assert result.is_valid == False
    
    def test_password_with_suggestions(self):
        """测试密码建议"""
        result = check_password_strength("password")
        assert len(result.suggestions) > 0


class TestPasswordHashing:
    """密码加密测试"""
    
    def test_password_hash(self):
        """测试密码加密"""
        password = "testPassword123!"
        hashed = get_password_hash(password)
        assert hashed != password
        assert len(hashed) > 0
    
    def test_password_verify_success(self):
        """测试密码验证成功"""
        password = "testPassword123!"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) == True
    
    def test_password_verify_failure(self):
        """测试密码验证失败"""
        password = "testPassword123!"
        wrong_password = "wrongPassword123!"
        hashed = get_password_hash(password)
        assert verify_password(wrong_password, hashed) == False
    
    def test_different_passwords_different_hashes(self):
        """测试相同密码生成不同哈希（盐值不同）"""
        password = "testPassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        assert hash1 != hash2
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)


class TestJWTToken:
    """JWT Token 测试"""
    
    def test_create_access_token(self):
        """测试创建访问令牌"""
        data = {"sub": "testuser"}
        token = create_access_token(data)
        assert token is not None
        assert len(token) > 0
    
    def test_create_refresh_token(self):
        """测试创建刷新令牌"""
        data = {"sub": "testuser"}
        token = create_refresh_token(data)
        assert token is not None
        assert len(token) > 0
    
    def test_verify_access_token(self):
        """测试验证访问令牌"""
        data = {"sub": "testuser"}
        token = create_access_token(data)
        payload = verify_token(token, "access")
        assert payload is not None
        assert payload["sub"] == "testuser"
        assert payload["type"] == "access"
    
    def test_verify_refresh_token(self):
        """测试验证刷新令牌"""
        data = {"sub": "testuser"}
        token = create_refresh_token(data)
        payload = verify_token(token, "refresh")
        assert payload is not None
        assert payload["sub"] == "testuser"
        assert payload["type"] == "refresh"
    
    def test_verify_token_wrong_type(self):
        """测试令牌类型不匹配"""
        data = {"sub": "testuser"}
        access_token = create_access_token(data)
        payload = verify_token(access_token, "refresh")
        assert payload is None
    
    def test_verify_invalid_token(self):
        """测试无效令牌"""
        payload = verify_token("invalid_token", "access")
        assert payload is None
    
    def test_token_with_custom_expiry(self):
        """测试自定义过期时间"""
        data = {"sub": "testuser"}
        custom_delta = timedelta(hours=1)
        token = create_access_token(data, expires_delta=custom_delta)
        payload = verify_token(token, "access")
        assert payload is not None


class TestUsernameValidation:
    """用户名验证测试"""
    
    def test_valid_username(self):
        """测试有效用户名"""
        is_valid, message = validate_username_format("testuser")
        assert is_valid == True
    
    def test_username_with_chinese(self):
        """测试中文用户名"""
        is_valid, message = validate_username_format("测试用户")
        assert is_valid == True
    
    def test_username_with_underscore(self):
        """测试带下划线的用户名"""
        is_valid, message = validate_username_format("test_user")
        assert is_valid == True
    
    def test_short_username(self):
        """测试过短用户名"""
        is_valid, message = validate_username_format("ab")
        assert is_valid == False
    
    def test_long_username(self):
        """测试过长用户名"""
        is_valid, message = validate_username_format("a" * 51)
        assert is_valid == False
    
    def test_username_with_special_chars(self):
        """测试特殊字符用户名"""
        is_valid, message = validate_username_format("test@user")
        assert is_valid == False
    
    def test_reserved_username(self):
        """测试保留用户名"""
        is_valid, message = validate_username_format("admin")
        assert is_valid == False
    
    def test_empty_username(self):
        """测试空用户名"""
        is_valid, message = validate_username_format("")
        assert is_valid == False


class TestInputSanitization:
    """输入过滤测试"""
    
    def test_sanitize_normal_input(self):
        """测试正常输入"""
        result = sanitize_input("normal text")
        assert result == "normal text"
    
    def test_sanitize_html_tags(self):
        """测试HTML标签过滤"""
        result = sanitize_input("<script>alert('xss')</script>")
        assert "<script>" not in result
        assert "</script>" not in result
    
    def test_sanitize_quotes(self):
        """测试引号过滤"""
        result = sanitize_input('test"quote\'test')
        assert '"' not in result
        assert "'" not in result
    
    def test_sanitize_max_length(self):
        """测试最大长度限制"""
        long_text = "a" * 2000
        result = sanitize_input(long_text, max_length=100)
        assert len(result) == 100


class TestLoginAttemptLimit:
    """登录尝试限制测试"""
    
    def setup_method(self):
        """每个测试方法前清空登录尝试记录"""
        with login_lock:
            login_attempts.clear()
    
    def test_initial_attempts_allowed(self):
        """测试初始状态允许登录"""
        can_login, remaining = check_login_attempts("testuser")
        assert can_login == True
        assert remaining == 0
    
    def test_record_failed_attempts(self):
        """测试记录失败尝试"""
        for _ in range(4):
            record_login_attempt("testuser", False)
        
        can_login, _ = check_login_attempts("testuser")
        assert can_login == True
        
        record_login_attempt("testuser", False)
        can_login, remaining = check_login_attempts("testuser")
        assert can_login == False
        assert remaining > 0
    
    def test_successful_login_resets_attempts(self):
        """测试成功登录重置尝试次数"""
        for _ in range(3):
            record_login_attempt("testuser", False)
        
        record_login_attempt("testuser", True)
        can_login, remaining = check_login_attempts("testuser")
        assert can_login == True
        assert remaining == 0


class TestUserLoginModel:
    """用户登录模型测试"""
    
    def test_valid_login_data(self):
        """测试有效登录数据"""
        user = UserLogin(username="testuser", password="password123")
        assert user.username == "testuser"
        assert user.password == "password123"
    
    def test_login_with_remember_me(self):
        """测试记住我功能"""
        user = UserLogin(username="testuser", password="password123", remember_me=True)
        assert user.remember_me == True
    
    def test_invalid_username_format(self):
        """测试无效用户名格式"""
        with pytest.raises(ValueError):
            UserLogin(username="test@user", password="password123")


class TestUserRegisterModel:
    """用户注册模型测试"""
    
    def test_valid_register_data(self):
        """测试有效注册数据"""
        user = UserRegister(
            username="testuser",
            password="SecurePass123!",
            confirm_password="SecurePass123!"
        )
        assert user.username == "testuser"
    
    def test_password_mismatch(self):
        """测试密码不匹配"""
        with pytest.raises(ValueError):
            UserRegister(
                username="testuser",
                password="SecurePass123!",
                confirm_password="DifferentPass123!"
            )
    
    def test_weak_password_rejected(self):
        """测试弱密码被拒绝"""
        with pytest.raises(ValueError):
            UserRegister(
                username="testuser",
                password="123456",
                confirm_password="123456"
            )
    
    def test_short_username_rejected(self):
        """测试短用户名被拒绝"""
        with pytest.raises(ValueError):
            UserRegister(
                username="ab",
                password="SecurePass123!",
                confirm_password="SecurePass123!"
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
