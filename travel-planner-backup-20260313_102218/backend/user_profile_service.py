"""
用户画像RAG服务
实现用户偏好的自动提取、向量存储、语义检索
支持跨会话的个性化记忆
"""
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from dataclasses import dataclass, field
import json
import os
import hashlib
import secrets
import logging
import re
import numpy as np
from functools import lru_cache

try:
    from zhipuai import ZhipuAI
    ZHIPU_AVAILABLE = True
except ImportError:
    ZHIPU_AVAILABLE = False

from models import UserPreferenceVector, UserPreference as UserPreferenceModel

logger = logging.getLogger("travel_planner")


class PreferenceCategory:
    DIETARY = "dietary"
    MOBILITY = "mobility"
    COMPANION = "companion"
    INTEREST = "interest"
    BUDGET = "budget"
    PACE = "pace"
    ACCOMMODATION = "accommodation"
    TRANSPORT = "transport"
    RESTRICTION = "restriction"
    FAVORITE = "favorite"
    DISLIKE = "dislike"
    SPECIAL_NEED = "special_need"

    @classmethod
    def all_categories(cls) -> List[str]:
        return [
            cls.DIETARY, cls.MOBILITY, cls.COMPANION, cls.INTEREST,
            cls.BUDGET, cls.PACE, cls.ACCOMMODATION, cls.TRANSPORT,
            cls.RESTRICTION, cls.FAVORITE, cls.DISLIKE, cls.SPECIAL_NEED
        ]

    @classmethod
    def is_valid(cls, category: str) -> bool:
        return category in cls.all_categories()


class UserProfileError(Exception):
    def __init__(self, message: str, error_code: str = "UNKNOWN_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class EmbeddingAPIError(UserProfileError):
    def __init__(self, message: str):
        super().__init__(message, "EMBEDDING_API_ERROR")


class PreferenceExtractionError(UserProfileError):
    def __init__(self, message: str):
        super().__init__(message, "PREFERENCE_EXTRACTION_ERROR")


class DatabaseError(UserProfileError):
    def __init__(self, message: str):
        super().__init__(message, "DATABASE_ERROR")


class InputValidationError(UserProfileError):
    def __init__(self, message: str):
        super().__init__(message, "INPUT_VALIDATION_ERROR")


@dataclass
class UserPreference:
    preference_id: str
    category: str
    value: str
    source: str
    confidence: float = 1.0
    created_at: datetime = field(default_factory=datetime.now)
    last_used: datetime = field(default_factory=datetime.now)
    usage_count: int = 0
    embedding: Optional[List[float]] = None
    metadata: Dict = field(default_factory=dict)
    
    def __post_init__(self):
        if not PreferenceCategory.is_valid(self.category):
            logger.warning(f"Unknown preference category: {self.category}")
        self.confidence = max(0.0, min(1.0, self.confidence))
    
    def to_dict(self) -> Dict:
        return {
            "preference_id": self.preference_id,
            "category": self.category,
            "value": self.value,
            "source": self.source,
            "confidence": self.confidence,
            "created_at": self.created_at.isoformat(),
            "last_used": self.last_used.isoformat(),
            "usage_count": self.usage_count,
            "metadata": self.metadata
        }
    
    def update_usage(self):
        self.last_used = datetime.now()
        self.usage_count += 1
        self.confidence = min(1.0, self.confidence + 0.1)


class EmbeddingService:
    EMBEDDING_DIMENSION = 768
    CACHE_SIZE = 1000
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GLM_API_KEY")
        self.client = None
        self._initialized = False
        
        if ZHIPU_AVAILABLE and self.api_key:
            try:
                self.client = ZhipuAI(api_key=self.api_key)
                self._initialized = True
                logger.info("Embedding服务初始化成功 (ZhipuAI)")
            except Exception as e:
                logger.warning(f"ZhipuAI客户端初始化失败: {e}")
        else:
            logger.info("Embedding服务使用本地哈希模式")
    
    @lru_cache(maxsize=CACHE_SIZE)
    def get_embedding(self, text: str) -> List[float]:
        if not text or not isinstance(text, str):
            return self._simple_embedding("")
        
        sanitized_text = self._sanitize_text(text)
        
        if self.client and self._initialized:
            try:
                response = self.client.embeddings.create(
                    model="embedding-3",
                    input=sanitized_text
                )
                if response and response.data and len(response.data) > 0:
                    return response.data[0].embedding
                else:
                    logger.warning("Embedding API返回空响应，使用本地哈希")
            except Exception as e:
                logger.error(f"Embedding API调用失败: {type(e).__name__}")
        
        return self._simple_embedding(sanitized_text)
    
    def _sanitize_text(self, text: str) -> str:
        sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        return sanitized[:2000]
    
    def _simple_embedding(self, text: str) -> List[float]:
        hash_values = hashlib.sha256(text.encode('utf-8', errors='ignore')).digest()
        embedding = []
        for i in range(0, 64, 2):
            val = int.from_bytes(hash_values[i:i+2], 'big')
            embedding.append(val / 65535.0)
        while len(embedding) < self.EMBEDDING_DIMENSION:
            embedding.extend(embedding[:min(64, self.EMBEDDING_DIMENSION - len(embedding))])
        return embedding[:self.EMBEDDING_DIMENSION]
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        if not vec1 or not vec2:
            return 0.0
        
        try:
            arr1 = np.array(vec1, dtype=np.float32)
            arr2 = np.array(vec2, dtype=np.float32)
            
            if arr1.shape != arr2.shape:
                min_len = min(len(arr1), len(arr2))
                arr1 = arr1[:min_len]
                arr2 = arr2[:min_len]
            
            dot_product = np.dot(arr1, arr2)
            norm1 = np.linalg.norm(arr1)
            norm2 = np.linalg.norm(arr2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return float(dot_product / (norm1 * norm2))
        except Exception as e:
            logger.error(f"计算余弦相似度失败: {e}")
            return 0.0


class VectorStore:
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
        self.vectors: Dict[str, np.ndarray] = {}
        self.metadata: Dict[str, Dict] = {}
        self._lock = False
    
    def add(self, id: str, text: str, metadata: Dict) -> None:
        if not id or not isinstance(id, str):
            raise InputValidationError("无效的ID")
        
        try:
            embedding = self.embedding_service.get_embedding(text)
            self.vectors[id] = np.array(embedding, dtype=np.float32)
            self.metadata[id] = {"text": text, **metadata}
        except Exception as e:
            logger.error(f"添加向量失败: {e}")
            raise
    
    def search(self, query: str, top_k: int = 5, threshold: float = 0.5) -> List[Tuple[str, float, Dict]]:
        if not self.vectors:
            return []
        
        top_k = max(1, min(top_k, 100))
        threshold = max(0.0, min(1.0, threshold))
        
        query_embedding = self.embedding_service.get_embedding(query)
        query_vec = np.array(query_embedding, dtype=np.float32)
        
        scores = []
        for id, embedding in self.vectors.items():
            similarity = self._fast_cosine_similarity(query_vec, embedding)
            if similarity >= threshold:
                scores.append((id, similarity, self.metadata[id]))
        
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]
    
    def _fast_cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(vec1, vec2) / (norm1 * norm2))
    
    def delete(self, id: str) -> bool:
        if id in self.vectors:
            del self.vectors[id]
            del self.metadata[id]
            return True
        return False
    
    def get(self, id: str) -> Optional[Dict]:
        return self.metadata.get(id)
    
    def list_all(self) -> List[Dict]:
        return [{"id": k, **v} for k, v in self.metadata.items()]
    
    def clear(self) -> int:
        count = len(self.vectors)
        self.vectors.clear()
        self.metadata.clear()
        return count


class PreferenceExtractor:
    EXTRACTION_PROMPT = """你是一个用户偏好提取引擎。请从用户的输入中提取旅游相关的偏好信息。

偏好类别包括：
- dietary: 饮食偏好（如"不吃辣"、"素食"、"海鲜过敏"）
- mobility: 行动能力（如"腿脚不便"、"轮椅"、"恐高"）
- companion: 出行同伴类型（如"带老人"、"亲子游"、"情侣出行"）
- interest: 兴趣偏好（如"喜欢园林"、"爱好摄影"、"历史文化"）
- budget: 预算偏好（如"省钱"、"不差钱"、"性价比优先"）
- pace: 节奏偏好（如"轻松游"、"特种兵式旅游"）
- accommodation: 住宿偏好（如"喜欢民宿"、"必须五星级"）
- transport: 交通偏好（如"自驾"、"高铁优先"、"不坐飞机"）
- restriction: 限制条件（如"时间紧"、"必须周末"）
- favorite: 喜欢的目的地或景点
- dislike: 不喜欢的内容
- special_need: 特殊需求（如"需要无障碍设施"、"带宠物"）

请以JSON数组格式输出提取到的偏好：
[
  {
    "category": "偏好类别",
    "value": "偏好值",
    "confidence": 0.9,
    "source_text": "原文中对应的文字"
  }
]

如果用户输入中没有旅游相关的偏好信息，输出空数组 []。
仅输出JSON，不要包含其他解释。

用户输入：{user_input}"""
    
    MAX_INPUT_LENGTH = 5000
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GLM_API_KEY")
        self.client = None
        
        if ZHIPU_AVAILABLE and self.api_key:
            try:
                self.client = ZhipuAI(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"PreferenceExtractor初始化失败: {e}")
    
    async def extract(self, user_input: str) -> List[Dict]:
        if not user_input or not isinstance(user_input, str):
            return []
        
        sanitized_input = self._sanitize_input(user_input)
        
        if not self.client:
            return self._rule_based_extract(sanitized_input)
        
        try:
            response = self.client.chat.completions.create(
                model="glm-4-flash",
                messages=[
                    {"role": "user", "content": self.EXTRACTION_PROMPT.format(user_input=sanitized_input)}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            if not response or not response.choices:
                logger.warning("LLM响应为空，使用规则提取")
                return self._rule_based_extract(sanitized_input)
            
            content = response.choices[0].message.content
            if not content:
                return self._rule_based_extract(sanitized_input)
            
            content = content.strip()
            
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            preferences = json.loads(content.strip())
            
            if isinstance(preferences, list):
                return self._validate_preferences(preferences)
            return []
            
        except json.JSONDecodeError as e:
            logger.warning(f"JSON解析失败: {e}")
            return self._rule_based_extract(sanitized_input)
        except Exception as e:
            logger.error(f"偏好提取失败: {type(e).__name__}")
            return self._rule_based_extract(sanitized_input)
    
    def _sanitize_input(self, text: str) -> str:
        sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        return sanitized[:self.MAX_INPUT_LENGTH]
    
    def _validate_preferences(self, preferences: List[Dict]) -> List[Dict]:
        valid_prefs = []
        for pref in preferences:
            if not isinstance(pref, dict):
                continue
            
            category = pref.get("category")
            value = pref.get("value")
            
            if not category or not value:
                continue
            
            if not PreferenceCategory.is_valid(str(category)):
                continue
            
            confidence = pref.get("confidence", 0.8)
            if not isinstance(confidence, (int, float)):
                confidence = 0.8
            confidence = max(0.0, min(1.0, float(confidence)))
            
            valid_prefs.append({
                "category": str(category),
                "value": str(value)[:500],
                "confidence": confidence,
                "source_text": str(pref.get("source_text", ""))[:200]
            })
        
        return valid_prefs
    
    def _rule_based_extract(self, user_input: str) -> List[Dict]:
        preferences = []
        
        keyword_mappings = {
            PreferenceCategory.DIETARY: {
                "不吃辣": "不吃辣", "不能吃辣": "不吃辣", "素食": "素食",
                "吃素": "素食", "海鲜过敏": "海鲜过敏", "不吃海鲜": "不吃海鲜",
                "不吃羊肉": "不吃羊肉", "清真": "清真", "不吃猪肉": "不吃猪肉",
                "过敏": "食物过敏", "忌口": "有饮食忌口"
            },
            PreferenceCategory.MOBILITY: {
                "腿脚不便": "腿脚不便", "坐轮椅": "轮椅用户", "轮椅": "轮椅用户",
                "恐高": "恐高", "晕车": "晕车", "晕船": "晕船", "晕机": "晕机",
                "行动不便": "行动不便"
            },
            PreferenceCategory.COMPANION: {
                "带老人": "带老人", "老人": "带老人", "带小孩": "亲子游",
                "带孩子": "亲子游", "亲子": "亲子游", "情侣": "情侣出行",
                "一家人": "家庭出游", "全家": "家庭出游", "独自": "独自出行",
                "一个人": "独自出行"
            },
            PreferenceCategory.PACE: {
                "轻松": "轻松", "休闲": "轻松", "特种兵": "特种兵式",
                "紧凑": "紧凑", "慢游": "慢游", "深度游": "深度游"
            },
            PreferenceCategory.BUDGET: {
                "省钱": "省钱", "穷游": "省钱", "性价比": "性价比优先",
                "不差钱": "不差钱", "豪华": "豪华", "高端": "高端"
            },
            PreferenceCategory.INTEREST: {
                "园林": "园林", "摄影": "摄影", "历史": "历史文化",
                "文化": "文化", "美食": "美食", "自然": "自然风光",
                "购物": "购物", "温泉": "温泉", "古镇": "古镇"
            }
        }
        
        for category, keywords in keyword_mappings.items():
            for keyword, value in keywords.items():
                if keyword in user_input:
                    preferences.append({
                        "category": category,
                        "value": value,
                        "confidence": 0.9,
                        "source_text": keyword
                    })
        
        return preferences


class UserProfileService:
    def __init__(self, db: Session = None, api_key: Optional[str] = None):
        self.db = db
        self.embedding_service = EmbeddingService(api_key)
        self.vector_store = VectorStore(self.embedding_service)
        self.extractor = PreferenceExtractor(api_key)
        
        self.user_profiles: Dict[int, Dict[str, UserPreference]] = {}
        self._loaded = False
        
        if db:
            self._load_from_db()
    
    def _load_from_db(self) -> None:
        if not self.db or self._loaded:
            return
        
        try:
            vectors = self.db.query(UserPreferenceVector).all()
            loaded_count = 0
            
            for vec in vectors:
                try:
                    if not vec.user_preference:
                        continue
                    
                    user_id = vec.user_preference.user_id
                    if not user_id:
                        continue
                    
                    if user_id not in self.user_profiles:
                        self.user_profiles[user_id] = {}
                    
                    embedding = None
                    if vec.embedding:
                        try:
                            embedding = json.loads(vec.embedding)
                            if not isinstance(embedding, list):
                                embedding = None
                        except json.JSONDecodeError:
                            logger.debug(f"无法解析embedding: {vec.preference_id}")
                            embedding = None
                    
                    preference = UserPreference(
                        preference_id=vec.preference_id,
                        category=vec.category,
                        value=vec.value,
                        source=vec.source,
                        confidence=vec.confidence,
                        embedding=embedding,
                        metadata=vec.extra_metadata or {},
                        usage_count=vec.usage_count or 0,
                        last_used=vec.last_used or datetime.now(),
                        created_at=vec.created_at or datetime.now()
                    )
                    
                    self.user_profiles[user_id][vec.preference_id] = preference
                    
                    self.vector_store.add(
                        id=vec.preference_id,
                        text=f"{vec.category}: {vec.value}",
                        metadata={
                            "user_id": user_id,
                            "category": vec.category,
                            "value": vec.value,
                            "confidence": vec.confidence
                        }
                    )
                    loaded_count += 1
                    
                except Exception as e:
                    logger.error(f"加载偏好向量失败 {vec.preference_id}: {e}")
                    continue
            
            self._loaded = True
            logger.info(f"从数据库加载了 {loaded_count} 个用户偏好")
            
        except Exception as e:
            logger.error(f"从数据库加载用户偏好失败: {e}")
    
    async def extract_and_store(
        self,
        user_id: int,
        user_input: str,
        source: str = "chat"
    ) -> List[UserPreference]:
        if not isinstance(user_id, int) or user_id <= 0:
            raise InputValidationError(f"无效的用户ID: {user_id}")
        
        preferences_data = await self.extractor.extract(user_input)
        
        if not preferences_data:
            return []
        
        stored_preferences = []
        
        for pref_data in preferences_data:
            category = pref_data.get("category")
            value = pref_data.get("value")
            confidence = pref_data.get("confidence", 0.8)
            source_text = pref_data.get("source_text", "")
            
            if not category or not value:
                continue
            
            pref_id = self._generate_preference_id(user_id, category, value)
            
            if user_id not in self.user_profiles:
                self.user_profiles[user_id] = {}
            
            if pref_id in self.user_profiles[user_id]:
                existing = self.user_profiles[user_id][pref_id]
                existing.update_usage()
                self._update_in_db(pref_id, existing)
                stored_preferences.append(existing)
            else:
                preference = UserPreference(
                    preference_id=pref_id,
                    category=category,
                    value=value,
                    source=source,
                    confidence=confidence,
                    metadata={"source_text": source_text}
                )
                
                text_for_embedding = f"{category}: {value}"
                preference.embedding = self.embedding_service.get_embedding(text_for_embedding)
                
                self.user_profiles[user_id][pref_id] = preference
                
                self.vector_store.add(
                    id=pref_id,
                    text=text_for_embedding,
                    metadata={
                        "user_id": user_id,
                        "category": category,
                        "value": value,
                        "confidence": confidence
                    }
                )
                
                self._save_to_db(user_id, preference)
                stored_preferences.append(preference)
        
        return stored_preferences
    
    def _save_to_db(self, user_id: int, preference: UserPreference) -> None:
        if not self.db:
            return
        
        try:
            user_pref = self.db.query(UserPreferenceModel).filter(
                UserPreferenceModel.user_id == user_id
            ).first()
            
            if not user_pref:
                user_pref = UserPreferenceModel(user_id=user_id)
                self.db.add(user_pref)
                self.db.flush()
            
            embedding_json = json.dumps(preference.embedding) if preference.embedding else None
            
            vector = UserPreferenceVector(
                user_preference_id=user_pref.id,
                preference_id=preference.preference_id,
                category=preference.category,
                value=preference.value,
                source=preference.source,
                confidence=preference.confidence,
                embedding=embedding_json,
                extra_metadata=preference.metadata,
                usage_count=preference.usage_count,
                last_used=preference.last_used
            )
            
            self.db.add(vector)
            self.db.commit()
            logger.debug(f"保存偏好到数据库: {preference.preference_id}")
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"保存用户偏好到数据库失败: {e}")
            raise DatabaseError(f"保存偏好失败: {e}")
    
    def _update_in_db(self, preference_id: str, preference: UserPreference) -> None:
        if not self.db:
            return
        
        try:
            vector = self.db.query(UserPreferenceVector).filter(
                UserPreferenceVector.preference_id == preference_id
            ).first()
            
            if vector:
                vector.confidence = preference.confidence
                vector.usage_count = preference.usage_count
                vector.last_used = preference.last_used
                self.db.commit()
                logger.debug(f"更新偏好: {preference_id}")
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新用户偏好失败: {e}")
    
    def _delete_from_db(self, preference_id: str) -> bool:
        if not self.db:
            return True
        
        try:
            deleted = self.db.query(UserPreferenceVector).filter(
                UserPreferenceVector.preference_id == preference_id
            ).delete()
            self.db.commit()
            return deleted > 0
        except Exception as e:
            self.db.rollback()
            logger.error(f"从数据库删除偏好失败: {e}")
            return False
    
    def _delete_user_from_db(self, user_id: int) -> int:
        if not self.db:
            return 0
        
        try:
            user_pref = self.db.query(UserPreferenceModel).filter(
                UserPreferenceModel.user_id == user_id
            ).first()
            
            if user_pref:
                deleted = self.db.query(UserPreferenceVector).filter(
                    UserPreferenceVector.user_preference_id == user_pref.id
                ).delete()
                self.db.commit()
                return deleted
            return 0
        except Exception as e:
            self.db.rollback()
            logger.error(f"从数据库删除用户偏好失败: {e}")
            return 0
    
    def _generate_preference_id(self, user_id: int, category: str, value: str) -> str:
        unique_str = f"{user_id}_{category}_{value}_{secrets.token_hex(4)}"
        return hashlib.sha256(unique_str.encode()).hexdigest()[:16]
    
    def get_user_preferences(
        self,
        user_id: int,
        categories: Optional[List[str]] = None
    ) -> List[UserPreference]:
        if user_id not in self.user_profiles:
            return []
        
        preferences = list(self.user_profiles[user_id].values())
        
        if categories:
            valid_categories = [c for c in categories if PreferenceCategory.is_valid(c)]
            if valid_categories:
                preferences = [p for p in preferences if p.category in valid_categories]
        
        return sorted(preferences, key=lambda x: x.confidence, reverse=True)
    
    def search_relevant_preferences(
        self,
        user_id: int,
        query: str,
        top_k: int = 5
    ) -> List[Tuple[UserPreference, float]]:
        user_prefs = self.user_profiles.get(user_id, {})
        
        if not user_prefs:
            return []
        
        query_embedding = self.embedding_service.get_embedding(query)
        
        results = []
        for pref_id, pref in user_prefs.items():
            if pref.embedding:
                similarity = self.embedding_service.cosine_similarity(
                    query_embedding, pref.embedding
                )
                if similarity > 0.3:
                    results.append((pref, similarity))
        
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
    
    def get_constraints_for_planning(self, user_id: int) -> Dict[str, Any]:
        preferences = self.get_user_preferences(user_id)
        
        constraints = {
            "dietary_restrictions": [],
            "mobility_constraints": [],
            "interests": [],
            "dislikes": [],
            "special_needs": [],
            "companion_type": None,
            "pace_preference": None,
            "budget_preference": None
        }
        
        for pref in preferences:
            category = pref.category
            value = pref.value
            
            if category == PreferenceCategory.DIETARY:
                constraints["dietary_restrictions"].append(value)
            elif category == PreferenceCategory.MOBILITY:
                constraints["mobility_constraints"].append(value)
            elif category == PreferenceCategory.INTEREST:
                constraints["interests"].append(value)
            elif category == PreferenceCategory.DISLIKE:
                constraints["dislikes"].append(value)
            elif category == PreferenceCategory.SPECIAL_NEED:
                constraints["special_needs"].append(value)
            elif category == PreferenceCategory.COMPANION:
                constraints["companion_type"] = value
            elif category == PreferenceCategory.PACE:
                constraints["pace_preference"] = value
            elif category == PreferenceCategory.BUDGET:
                constraints["budget_preference"] = value
        
        return constraints
    
    def build_preference_context(self, user_id: int) -> str:
        preferences = self.get_user_preferences(user_id)
        
        if not preferences:
            return ""
        
        context_parts = ["用户画像信息："]
        
        category_names = {
            PreferenceCategory.DIETARY: "饮食偏好",
            PreferenceCategory.MOBILITY: "行动能力",
            PreferenceCategory.COMPANION: "出行同伴",
            PreferenceCategory.INTEREST: "兴趣偏好",
            PreferenceCategory.BUDGET: "预算偏好",
            PreferenceCategory.PACE: "节奏偏好",
            PreferenceCategory.ACCOMMODATION: "住宿偏好",
            PreferenceCategory.TRANSPORT: "交通偏好",
            PreferenceCategory.RESTRICTION: "限制条件",
            PreferenceCategory.FAVORITE: "喜欢",
            PreferenceCategory.DISLIKE: "不喜欢",
            PreferenceCategory.SPECIAL_NEED: "特殊需求",
        }
        
        grouped: Dict[str, List[str]] = {}
        for pref in preferences:
            if pref.category not in grouped:
                grouped[pref.category] = []
            grouped[pref.category].append(pref.value)
        
        for category, values in grouped.items():
            category_name = category_names.get(category, category)
            context_parts.append(f"- {category_name}: {', '.join(values)}")
        
        return "\n".join(context_parts)
    
    def remove_preference(self, user_id: int, preference_id: str) -> bool:
        if user_id not in self.user_profiles:
            return False
        
        if preference_id not in self.user_profiles[user_id]:
            return False
        
        del self.user_profiles[user_id][preference_id]
        self.vector_store.delete(preference_id)
        self._delete_from_db(preference_id)
        
        logger.info(f"删除用户偏好: user_id={user_id}, preference_id={preference_id}")
        return True
    
    def clear_user_profile(self, user_id: int) -> int:
        if user_id not in self.user_profiles:
            return 0
        
        count = len(self.user_profiles[user_id])
        
        for pref_id in list(self.user_profiles[user_id].keys()):
            self.vector_store.delete(pref_id)
        
        del self.user_profiles[user_id]
        self._delete_user_from_db(user_id)
        
        logger.info(f"清除用户画像: user_id={user_id}, count={count}")
        return count
    
    def export_profile(self, user_id: int) -> Dict:
        preferences = self.get_user_preferences(user_id)
        
        return {
            "user_id": user_id,
            "preferences": [p.to_dict() for p in preferences],
            "summary": self.get_constraints_for_planning(user_id),
            "exported_at": datetime.now().isoformat()
        }
    
    def import_profile(self, user_id: int, profile_data: Dict) -> int:
        if not isinstance(profile_data, dict):
            raise InputValidationError("无效的导入数据格式")
        
        imported_count = 0
        
        for pref_data in profile_data.get("preferences", []):
            if not isinstance(pref_data, dict):
                continue
            
            pref_id = pref_data.get("preference_id")
            category = pref_data.get("category")
            value = pref_data.get("value")
            
            if not category or not value:
                continue
            
            if not PreferenceCategory.is_valid(str(category)):
                continue
            
            if not pref_id:
                pref_id = self._generate_preference_id(user_id, str(category), str(value))
            
            confidence = pref_data.get("confidence", 0.8)
            if not isinstance(confidence, (int, float)):
                confidence = 0.8
            
            preference = UserPreference(
                preference_id=str(pref_id),
                category=str(category),
                value=str(value)[:500],
                source=pref_data.get("source", "import"),
                confidence=float(confidence),
                metadata=pref_data.get("metadata", {}) if isinstance(pref_data.get("metadata"), dict) else {}
            )
            
            text_for_embedding = f"{category}: {value}"
            preference.embedding = self.embedding_service.get_embedding(text_for_embedding)
            
            if user_id not in self.user_profiles:
                self.user_profiles[user_id] = {}
            
            self.user_profiles[user_id][str(pref_id)] = preference
            
            self.vector_store.add(
                id=str(pref_id),
                text=text_for_embedding,
                metadata={
                    "user_id": user_id,
                    "category": str(category),
                    "value": str(value)[:500]
                }
            )
            
            imported_count += 1
        
        logger.info(f"导入用户画像: user_id={user_id}, count={imported_count}")
        return imported_count


class ProfileAwareItineraryService:
    def __init__(
        self,
        db: Session,
        profile_service: UserProfileService,
        itinerary_service
    ):
        self.db = db
        self.profile_service = profile_service
        self.itinerary_service = itinerary_service
    
    async def plan_with_profile(
        self,
        user_id: int,
        user_input: str,
        **kwargs
    ) -> Dict:
        await self.profile_service.extract_and_store(
            user_id, user_input, source="planning"
        )
        
        constraints = self.profile_service.get_constraints_for_planning(user_id)
        
        preference_context = self.profile_service.build_preference_context(user_id)
        
        enhanced_input = user_input
        if preference_context:
            enhanced_input = f"{preference_context}\n\n用户当前需求：{user_input}"
        
        if constraints.get("companion_type") and "companion_type" not in kwargs:
            kwargs["companion_type"] = self._map_companion_type(
                constraints["companion_type"]
            )
        
        if constraints.get("pace_preference") and "pace" not in kwargs:
            kwargs["pace"] = self._map_pace(constraints["pace_preference"])
        
        if constraints.get("interests") and "interests" not in kwargs:
            kwargs["interests"] = constraints["interests"]
        
        result = await self.itinerary_service.generate_itinerary(
            **kwargs
        )
        
        if result.get("success") and result.get("itinerary"):
            result["itinerary"]["user_constraints"] = constraints
            result["itinerary"]["preference_context"] = preference_context
        
        return result
    
    def _map_companion_type(self, value: str) -> str:
        mapping = {
            "带老人": "elderly",
            "亲子游": "family_with_kids",
            "情侣出行": "couple",
            "家庭出游": "family_with_kids",
            "独行": "solo",
            "独自出行": "solo",
            "朋友": "friends"
        }
        return mapping.get(value, "couple")
    
    def _map_pace(self, value: str) -> str:
        mapping = {
            "轻松": "relaxed",
            "慢游": "relaxed",
            "紧凑": "tight",
            "特种兵式": "tight",
            "深度游": "relaxed"
        }
        return mapping.get(value, "normal")
