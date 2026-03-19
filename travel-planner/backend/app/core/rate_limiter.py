"""
限流器实现 - 令牌桶算法
"""
import time
import asyncio
from collections import deque
from typing import Optional


class RateLimiter:
    """令牌桶限流器"""

    def __init__(self, max_calls: int, period: float, max_concurrent: int = 1):
        """
        初始化限流器

        Args:
            max_calls: 时间窗口内最大调用数
            period: 时间窗口长度(秒)
            max_concurrent: 最大并发数
        """
        self.max_calls = max_calls
        self.period = period
        self.max_concurrent = max_concurrent
        self.calls = deque()  # 调用记录
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def __aenter__(self):
        """进入上下文"""
        await self.semaphore.acquire()

        now = time.time()
        # 清理过期记录
        while self.calls and self.calls[0] <= now - self.period:
            self.calls.popleft()

        # 检查是否超过限制
        if len(self.calls) >= self.max_calls:
            # 等待下一个时间窗口
            sleep_time = self.period - (now - self.calls[0])
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)

        self.calls.append(time.time())

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """退出上下文"""
        self.semaphore.release()