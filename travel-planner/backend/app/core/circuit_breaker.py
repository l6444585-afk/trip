"""
熔断器实现
"""
import time
import logging
from typing import Optional, Type, Callable
from functools import wraps

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """熔断器实现"""

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: Optional[Type[Exception]] = Exception
    ):
        """
        初始化熔断器

        Args:
            failure_threshold: 失败阈值
            recovery_timeout: 恢复超时(秒)
            expected_exception: 预期的异常类型
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    async def call(self, func, *args, **kwargs):
        """
        调用函数，带熔断保护

        Args:
            func: 要调用的函数
            args: 函数参数
            kwargs: 函数关键字参数

        Returns:
            函数返回值

        Raises:
            预期异常类型
        """
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
            else:
                raise Exception("熔断器已打开，请稍后再试")

        try:
            result = await func(*args, **kwargs)

            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0

            return result
        except self.expected_exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                logger.error(f"熔断器打开: {func.__name__}")

            raise

    def reset(self):
        """重置熔断器"""
        self.failure_count = 0
        self.state = "CLOSED"
        self.last_failure_time = None


def circuit_breaker(
    failure_threshold: int = 5,
    recovery_timeout: int = 60,
    expected_exception: Type[Exception] = Exception
):
    """熔断器装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            breaker = CircuitBreaker(
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout,
                expected_exception=expected_exception
            )
            return await breaker.call(func, *args, **kwargs)
        return wrapper
    return decorator