from typing import Any, Optional, List
from fastapi import HTTPException, status
from pydantic import BaseModel, Field
from enum import Enum

class ResponseStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"

class ApiResponse(BaseModel):
    status: ResponseStatus = Field(..., description="响应状态")
    message: str = Field(..., description="响应消息")
    data: Optional[Any] = Field(None, description="响应数据")
    code: int = Field(200, description="业务状态码")
    timestamp: str = Field(default_factory=lambda: str(datetime.now()), description="时间戳")

    @classmethod
    def success(cls, message: str = "操作成功", data: Any = None, code: int = 200) -> "ApiResponse":
        return cls(
            status=ResponseStatus.SUCCESS,
            message=message,
            data=data,
            code=code
        )
    
    @classmethod
    def error(cls, message: str = "操作失败", data: Any = None, code: int = 500) -> "ApiResponse":
        return cls(
            status=ResponseStatus.ERROR,
            message=message,
            data=data,
            code=code
        )
    
    @classmethod
    def warning(cls, message: str = "警告", data: Any = None, code: int = 400) -> "ApiResponse":
        return cls(
            status=ResponseStatus.WARNING,
            message=message,
            data=data,
            code=code
        )

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    @classmethod
    def create(
        cls,
        items: List[Any],
        total: int,
        page: int = 1,
        page_size: int = 10
    ) -> "PaginatedResponse":
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

class ValidationError(BaseModel):
    field: str
    message: str

class ErrorResponse(BaseModel):
    status: ResponseStatus = ResponseStatus.ERROR
    message: str
    errors: Optional[List[ValidationError]] = None
    code: int
    timestamp: str

def handle_exception(exc: Exception) -> ErrorResponse:
    if isinstance(exc, HTTPException):
        return ErrorResponse(
            message=exc.detail,
            code=exc.status_code,
            timestamp=str(datetime.now())
        )
    
    return ErrorResponse(
        message=str(exc),
        code=500,
        timestamp=str(datetime.now())
    )
