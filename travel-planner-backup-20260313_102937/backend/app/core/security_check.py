"""
安全检查模块
在应用启动时验证关键安全配置
"""
import os
import secrets
import warnings
from typing import List, Tuple
from dataclasses import dataclass

from .config import settings


@dataclass
class SecurityCheckResult:
    level: str
    category: str
    message: str
    recommendation: str
    passed: bool


class SecurityChecker:
    def __init__(self):
        self.results: List[SecurityCheckResult] = []
        self.critical_failures = 0
        self.warnings = 0
    
    def check_secret_key(self) -> SecurityCheckResult:
        secret_key = settings.SECRET_KEY
        insecure_keys = [
            "your-secret-key-here",
            "your-secret-key-change-in-production",
            "change-me",
            "secret",
            "test",
            "development",
        ]
        
        if not secret_key:
            return SecurityCheckResult(
                level="CRITICAL",
                category="认证安全",
                message="SECRET_KEY 未设置",
                recommendation="请在 .env 文件中设置 SECRET_KEY 环境变量",
                passed=False
            )
        
        if secret_key in insecure_keys:
            return SecurityCheckResult(
                level="CRITICAL",
                category="认证安全",
                message=f"SECRET_KEY 使用了不安全的默认值: {secret_key[:10]}...",
                recommendation="请生成一个安全的随机密钥: python -c \"import secrets; print(secrets.token_urlsafe(32))\"",
                passed=False
            )
        
        if len(secret_key) < 32:
            return SecurityCheckResult(
                level="WARNING",
                category="认证安全",
                message=f"SECRET_KEY 长度不足 ({len(secret_key)} 字符)",
                recommendation="建议使用至少 32 字符的密钥",
                passed=True
            )
        
        return SecurityCheckResult(
            level="INFO",
            category="认证安全",
            message="SECRET_KEY 配置正确",
            recommendation="",
            passed=True
        )
    
    def check_api_keys(self) -> List[SecurityCheckResult]:
        results = []
        api_keys = [
            (settings.GLM_API_KEY, "智谱 AI"),
            (settings.AMAP_API_KEY, "高德地图"),
            (settings.SILICONFLOW_API_KEY, "SiliconFlow"),
        ]
        
        for key_value, service_name in api_keys:
            if key_value and key_value.startswith("your_"):
                results.append(SecurityCheckResult(
                    level="WARNING",
                    category="API 密钥",
                    message=f"{service_name} API 密钥使用占位符",
                    recommendation=f"请设置有效的 API 密钥或移除该配置",
                    passed=True
                ))
            elif key_value:
                results.append(SecurityCheckResult(
                    level="INFO",
                    category="API 密钥",
                    message=f"{service_name} API 密钥已配置",
                    recommendation="",
                    passed=True
                ))
        
        return results
    
    def check_environment(self) -> SecurityCheckResult:
        env = settings.ENVIRONMENT
        
        if env == "production":
            if settings.DEBUG:
                return SecurityCheckResult(
                    level="CRITICAL",
                    category="环境配置",
                    message="生产环境启用了 DEBUG 模式",
                    recommendation="请在生产环境中设置 DEBUG=false",
                    passed=False
                )
            
            cors_origins = str(settings.CORS_ORIGINS)
            if "*" in cors_origins:
                return SecurityCheckResult(
                    level="CRITICAL",
                    category="CORS 配置",
                    message="生产环境 CORS 允许所有来源",
                    recommendation="请设置具体的 CORS_ORIGINS，例如: http://localhost:3000,https://your-domain.com",
                    passed=False
                )
            
            return SecurityCheckResult(
                level="INFO",
                category="环境配置",
                message="生产环境配置正确",
                recommendation="",
                passed=True
            )
        
        return SecurityCheckResult(
            level="INFO",
            category="环境配置",
            message=f"当前环境: {env}",
            recommendation="",
            passed=True
        )
    
    def check_database(self) -> SecurityCheckResult:
        db_url = settings.DATABASE_URL
        
        if "sqlite" in db_url.lower():
            return SecurityCheckResult(
                level="WARNING",
                category="数据库",
                message="使用 SQLite 数据库",
                recommendation="生产环境建议使用 PostgreSQL 或 MySQL",
                passed=True
            )
        
        return SecurityCheckResult(
            level="INFO",
            category="数据库",
            message="数据库配置正确",
            recommendation="",
            passed=True
        )
    
    def check_demo_user(self) -> SecurityCheckResult:
        demo_enabled = settings.DEMO_USER_ENABLED
        env = settings.ENVIRONMENT
        
        if demo_enabled and env == "production":
            return SecurityCheckResult(
                level="CRITICAL",
                category="用户安全",
                message="生产环境启用了演示用户",
                recommendation="请在生产环境中设置 DEMO_USER_ENABLED=false",
                passed=False
            )
        
        return SecurityCheckResult(
            level="INFO",
            category="用户安全",
            message="演示用户配置正确",
            recommendation="",
            passed=True
        )
    
    def run_all_checks(self) -> Tuple[List[SecurityCheckResult], bool]:
        self.results = []
        
        self.results.append(self.check_secret_key())
        self.results.extend(self.check_api_keys())
        self.results.append(self.check_environment())
        self.results.append(self.check_database())
        self.results.append(self.check_demo_user())
        
        critical_failures = sum(1 for r in self.results if r.level == "CRITICAL" and not r.passed)
        warnings = sum(1 for r in self.results if r.level == "WARNING")
        
        self.critical_failures = critical_failures
        self.warnings = warnings
        
        is_safe = critical_failures == 0
        
        return self.results, is_safe
    
    def print_report(self):
        print("\n" + "=" * 60)
        print("🔒 安全检查报告")
        print("=" * 60)
        
        for result in self.results:
            icon = "✅" if result.passed else ("❌" if result.level == "CRITICAL" else "⚠️")
            print(f"\n{icon} [{result.level}] {result.category}")
            print(f"   {result.message}")
            if result.recommendation:
                print(f"   💡 {result.recommendation}")
        
        print("\n" + "-" * 60)
        print(f"📊 检查结果: {len(self.results)} 项")
        print(f"   ❌ 严重问题: {self.critical_failures}")
        print(f"   ⚠️  警告: {self.warnings}")
        print(f"   ✅ 通过: {len(self.results) - self.critical_failures - self.warnings}")
        print("=" * 60 + "\n")
        
        if self.critical_failures > 0:
            print("🚨 发现严重安全问题，请立即修复后再部署！\n")
            return False
        elif self.warnings > 0:
            print("⚠️  存在安全警告，建议尽快处理。\n")
            return True
        else:
            print("✅ 所有安全检查通过！\n")
            return True


def run_security_check():
    checker = SecurityChecker()
    results, is_safe = checker.run_all_checks()
    checker.print_report()
    return is_safe


if __name__ == "__main__":
    run_security_check()
