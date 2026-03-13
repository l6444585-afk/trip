"""
AI服务工厂
根据配置自动选择可用的AI服务
"""
from typing import Optional
from app.services.ai.base import BaseAIService, AIProvider
from app.services.ai.zhipu_service import ZhipuAIService
from app.services.ai.base import MockAIService
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_ai_service_instance: Optional[BaseAIService] = None


def get_ai_service() -> BaseAIService:
    """获取AI服务实例（单例）"""
    global _ai_service_instance

    if _ai_service_instance is not None:
        return _ai_service_instance

    provider = settings.get_ai_provider()

    if provider == "zhipu":
        logger.info("使用智谱AI服务")
        _ai_service_instance = ZhipuAIService()
    elif provider == "siliconflow":
        logger.info("使用硅基流动AI服务")
        _ai_service_instance = _create_siliconflow_service()
    else:
        logger.warning("未配置有效的AI服务，使用模拟服务")
        _ai_service_instance = MockAIService()

    return _ai_service_instance


def _create_siliconflow_service() -> BaseAIService:
    """创建硅基流动服务"""
    if not settings.SILICONFLOW_API_KEY:
        return MockAIService()

    from app.services.ai.siliconflow_service import SiliconFlowService
    return SiliconFlowService()


def reset_ai_service():
    """重置AI服务实例"""
    global _ai_service_instance
    _ai_service_instance = None
