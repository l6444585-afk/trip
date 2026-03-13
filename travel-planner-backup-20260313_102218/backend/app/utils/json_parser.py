"""
JSON解析工具
统一处理LLM返回的JSON解析，支持多种格式容错
"""
import json
import re
from typing import Optional, Dict, Any, List
from app.core.logging import get_logger

logger = get_logger(__name__)


class JSONParseError(Exception):
    """JSON解析错误"""
    def __init__(self, message: str, raw_content: str = ""):
        self.message = message
        self.raw_content = raw_content[:500]
        super().__init__(self.message)


class JSONParser:
    """JSON解析器，支持多种格式容错"""

    @staticmethod
    def parse(
        content: str,
        strip_code_block: bool = True,
        fix_trailing_comma: bool = True,
        fix_single_quotes: bool = True,
        extract_json_object: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        解析JSON字符串，支持多种容错处理

        Args:
            content: 待解析的字符串
            strip_code_block: 是否移除代码块标记
            fix_trailing_comma: 是否修复尾部逗号
            fix_single_quotes: 是否将单引号替换为双引号
            extract_json_object: 是否从文本中提取JSON对象

        Returns:
            解析后的字典，解析失败返回None
        """
        if not content or not isinstance(content, str):
            return None

        content = content.strip()

        if strip_code_block:
            content = JSONParser._strip_code_block(content)

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        if extract_json_object:
            extracted = JSONParser._extract_json_object(content)
            if extracted:
                try:
                    return json.loads(extracted)
                except json.JSONDecodeError:
                    pass

        if fix_trailing_comma or fix_single_quotes:
            fixed_content = content
            if fix_trailing_comma:
                fixed_content = JSONParser._fix_trailing_comma(fixed_content)
            if fix_single_quotes:
                fixed_content = JSONParser._fix_single_quotes(fixed_content)

            try:
                return json.loads(fixed_content)
            except json.JSONDecodeError:
                pass

        logger.warning(f"JSON解析失败，原始内容: {content[:200]}...")
        return None

    @staticmethod
    def parse_or_raise(content: str) -> Dict[str, Any]:
        """解析JSON，失败时抛出异常"""
        result = JSONParser.parse(content)
        if result is None:
            raise JSONParseError("JSON解析失败", content)
        return result

    @staticmethod
    def parse_list(content: str) -> Optional[List[Any]]:
        """解析JSON数组"""
        result = JSONParser.parse(content)
        if isinstance(result, list):
            return result
        return None

    @staticmethod
    def _strip_code_block(content: str) -> str:
        """移除代码块标记"""
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]

        if content.endswith("```"):
            content = content[:-3]

        return content.strip()

    @staticmethod
    def _extract_json_object(content: str) -> Optional[str]:
        """从文本中提取JSON对象"""
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            return json_match.group()
        return None

    @staticmethod
    def _fix_trailing_comma(content: str) -> str:
        """修复尾部逗号"""
        return re.sub(r',(\s*[}\]])', r'\1', content)

    @staticmethod
    def _fix_single_quotes(content: str) -> str:
        """将单引号替换为双引号（简单实现）"""
        if '"' in content:
            return content
        return content.replace("'", '"')


def safe_json_parse(content: str, default: Any = None) -> Any:
    """
    安全的JSON解析函数

    Args:
        content: 待解析的字符串
        default: 解析失败时的默认返回值

    Returns:
        解析结果或默认值
    """
    result = JSONParser.parse(content)
    return result if result is not None else default


def extract_json_from_llm_response(content: str) -> Dict[str, Any]:
    """
    从LLM响应中提取JSON

    Args:
        content: LLM返回的内容

    Returns:
        解析后的字典

    Raises:
        JSONParseError: 解析失败时抛出
    """
    return JSONParser.parse_or_raise(content)
