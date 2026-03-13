"""
AI服务基类
定义统一的AI服务接口
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, AsyncGenerator
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import asyncio

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class AIProvider(str, Enum):
    ZHIPU = "zhipu"
    SILICONFLOW = "siliconflow"
    MOCK = "mock"


@dataclass
class ChatMessage:
    role: str
    content: str
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, str]:
        return {"role": self.role, "content": self.content}


@dataclass
class AIResponse:
    content: str
    provider: AIProvider
    model: str
    usage: Dict[str, int] = field(default_factory=dict)
    finish_reason: str = "stop"
    latency_ms: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "provider": self.provider.value,
            "model": self.model,
            "usage": self.usage,
            "finish_reason": self.finish_reason,
            "latency_ms": self.latency_ms
        }


class BaseAIService(ABC):
    """AI服务基类"""

    def __init__(
        self,
        provider: AIProvider,
        model: str,
        max_tokens: int = 4000,
        temperature: float = 0.7
    ):
        self.provider = provider
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self._initialized = False

    @abstractmethod
    async def chat(
        self,
        messages: List[ChatMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AIResponse:
        """发送聊天请求"""
        pass

    @abstractmethod
    async def chat_stream(
        self,
        messages: List[ChatMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """发送流式聊天请求"""
        pass

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AIResponse:
        """生成文本"""
        messages = []
        if system_prompt:
            messages.append(ChatMessage(role="system", content=system_prompt))
        messages.append(ChatMessage(role="user", content=prompt))
        return await self.chat(messages, temperature, max_tokens)

    def _build_messages(self, messages: List[ChatMessage]) -> List[Dict[str, str]]:
        """构建消息列表"""
        return [msg.to_dict() for msg in messages]

    @property
    def is_initialized(self) -> bool:
        return self._initialized


class MockAIService(BaseAIService):
    """模拟AI服务（用于测试和开发）"""

    def __init__(self):
        super().__init__(AIProvider.MOCK, "mock-model")

    async def chat(
        self,
        messages: List[ChatMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AIResponse:
        last_message = messages[-1].content if messages else ""

        if any(greeting in last_message for greeting in ["你好", "您好", "hi", "hello"]):
            response_content = """你好！我是江浙沪旅游规划专家 🌟

我可以帮你规划：
🏞️ 自然风光游
🏯 古镇文化游
🎢 主题乐园游
📸 小众摄影游

请告诉我：
• 从哪个城市出发？
• 计划玩几天？
• 和谁一起去？"""
        elif "推荐" in last_message or "去哪" in last_message:
            response_content = """🎯 根据您的需求，推荐以下目的地：

**杭州西湖** ⭐⭐⭐⭐⭐
📍 亮点：断桥残雪、苏堤春晓、雷峰夕照
⏰ 建议天数：2-3天
💰 预算：人均约800-1500元
✨ 推荐理由：四季皆宜，适合各类人群"""
        else:
            response_content = """我理解您的需求了！让我为您规划一个完美的江浙沪之旅。

请告诉我：
1. 您从哪个城市出发？
2. 计划玩几天？
3. 大概预算是多少？
4. 和谁一起出行？

有了这些信息，我可以为您生成专属的行程方案！✨"""

        return AIResponse(
            content=response_content,
            provider=AIProvider.MOCK,
            model="mock-model",
            usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        )

    async def chat_stream(
        self,
        messages: List[ChatMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        response = await self.chat(messages, temperature, max_tokens)
        for char in response.content:
            yield char
            await asyncio.sleep(0.01)
