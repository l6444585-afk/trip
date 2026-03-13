"""
智谱AI服务实现
"""
from typing import List, Optional, Dict, Any, AsyncGenerator
import asyncio
import time

from app.services.ai.base import (
    BaseAIService, AIProvider, AIResponse, ChatMessage
)
from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import AIServiceError

logger = get_logger(__name__)


class ZhipuAIService(BaseAIService):
    """智谱AI服务"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ):
        super().__init__(
            provider=AIProvider.ZHIPU,
            model=model or settings.GLM_MODEL,
            max_tokens=max_tokens or settings.GLM_MAX_TOKENS,
            temperature=temperature or settings.GLM_TEMPERATURE
        )

        self.api_key = api_key or settings.GLM_API_KEY
        self._client = None

        if self.api_key:
            try:
                from zhipuai import ZhipuAI
                self._client = ZhipuAI(api_key=self.api_key)
                self._initialized = True
                logger.info(f"智谱AI服务初始化成功，模型: {self.model}")
            except ImportError:
                logger.warning("zhipuai未安装，请运行: pip install zhipuai")
            except Exception as e:
                logger.error(f"智谱AI服务初始化失败: {e}")
        else:
            logger.warning("未配置GLM_API_KEY，智谱AI服务不可用")

    async def chat(
        self,
        messages: List[ChatMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AIResponse:
        if not self._client:
            raise AIServiceError("智谱AI服务未初始化", provider="zhipu")

        start_time = time.time()

        try:
            response = await asyncio.to_thread(
                self._client.chat.completions.create,
                model=self.model,
                messages=self._build_messages(messages),
                temperature=temperature or self.temperature,
                max_tokens=max_tokens or self.max_tokens
            )

            latency_ms = int((time.time() - start_time) * 1000)

            return AIResponse(
                content=response.choices[0].message.content,
                provider=AIProvider.ZHIPU,
                model=self.model,
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                latency_ms=latency_ms
            )

        except Exception as e:
            logger.error(f"智谱AI调用失败: {e}")
            raise AIServiceError(f"智谱AI调用失败: {str(e)}", provider="zhipu")

    async def chat_stream(
        self,
        messages: List[ChatMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        if not self._client:
            raise AIServiceError("智谱AI服务未初始化", provider="zhipu")

        try:
            response = await asyncio.to_thread(
                self._client.chat.completions.create,
                model=self.model,
                messages=self._build_messages(messages),
                temperature=temperature or self.temperature,
                max_tokens=max_tokens or self.max_tokens,
                stream=True
            )

            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error(f"智谱AI流式调用失败: {e}")
            raise AIServiceError(f"智谱AI流式调用失败: {str(e)}", provider="zhipu")

    async def get_embedding(self, text: str) -> List[float]:
        """获取文本嵌入向量"""
        if not self._client:
            raise AIServiceError("智谱AI服务未初始化", provider="zhipu")

        try:
            response = await asyncio.to_thread(
                self._client.embeddings.create,
                model="embedding-3",
                input=text
            )

            if response and response.data:
                return response.data[0].embedding

        except Exception as e:
            logger.error(f"获取嵌入向量失败: {e}")

        return []
