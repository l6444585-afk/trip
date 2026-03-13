"""
异常处理模块
定义统一的异常类型和处理器
"""
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime


class ErrorCode(str, Enum):
    SUCCESS = "SUCCESS"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    DUPLICATE_ERROR = "DUPLICATE_ERROR"
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR"
    EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    AI_SERVICE_ERROR = "AI_SERVICE_ERROR"
    ITINERARY_GENERATION_ERROR = "ITINERARY_GENERATION_ERROR"


class AppException(Exception):
    """应用异常基类"""

    def __init__(
        self,
        message: str,
        error_code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": False,
            "error_code": self.error_code.value,
            "message": self.message,
            "details": self.details,
            "timestamp": datetime.now().isoformat()
        }


class ValidationError(AppException):
    """验证错误"""

    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict] = None):
        error_details = details or {}
        if field:
            error_details["field"] = field
        super().__init__(
            message=message,
            error_code=ErrorCode.VALIDATION_ERROR,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=error_details
        )


class AuthenticationError(AppException):
    """认证错误"""

    def __init__(self, message: str = "认证失败"):
        super().__init__(
            message=message,
            error_code=ErrorCode.AUTHENTICATION_ERROR,
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class AuthorizationError(AppException):
    """授权错误"""

    def __init__(self, message: str = "权限不足"):
        super().__init__(
            message=message,
            error_code=ErrorCode.AUTHORIZATION_ERROR,
            status_code=status.HTTP_403_FORBIDDEN
        )


class NotFoundError(AppException):
    """资源未找到"""

    def __init__(self, resource: str, identifier: Optional[str] = None):
        message = f"{resource}不存在"
        if identifier:
            message = f"{resource} '{identifier}' 不存在"
        super().__init__(
            message=message,
            error_code=ErrorCode.NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND
        )


class DuplicateError(AppException):
    """重复资源错误"""

    def __init__(self, resource: str, field: str, value: str):
        super().__init__(
            message=f"{resource}的{field} '{value}' 已存在",
            error_code=ErrorCode.DUPLICATE_ERROR,
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"field": field, "value": value}
        )


class ExternalAPIError(AppException):
    """外部API错误"""

    def __init__(self, service: str, message: str = "外部服务暂时不可用"):
        super().__init__(
            message=message,
            error_code=ErrorCode.EXTERNAL_API_ERROR,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"service": service}
        )


class AIServiceError(AppException):
    """AI服务错误"""

    def __init__(self, message: str = "AI服务暂时不可用", provider: Optional[str] = None):
        details = {}
        if provider:
            details["provider"] = provider
        super().__init__(
            message=message,
            error_code=ErrorCode.AI_SERVICE_ERROR,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details
        )


class ItineraryGenerationError(AppException):
    """行程生成错误"""

    def __init__(self, message: str = "行程生成失败", details: Optional[Dict] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.ITINERARY_GENERATION_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """应用异常处理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """HTTP异常处理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error_code": ErrorCode.UNKNOWN_ERROR.value,
            "message": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """验证异常处理器"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error_code": ErrorCode.VALIDATION_ERROR.value,
            "message": "请求参数验证失败",
            "details": {"errors": errors},
            "timestamp": datetime.now().isoformat()
        }
    )


def setup_exception_handlers(app):
    """注册异常处理器"""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
