"""
用户画像服务单元测试
验证修复后的功能正确性
"""
import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, MagicMock, patch, AsyncMock
import numpy as np

from user_profile_service import (
    UserPreference, PreferenceCategory, EmbeddingService,
    VectorStore, PreferenceExtractor, UserProfileService,
    UserProfileError, InputValidationError, DatabaseError
)


class TestPreferenceCategory:
    def test_all_categories(self):
        categories = PreferenceCategory.all_categories()
        assert len(categories) == 12
        assert "dietary" in categories
        assert "mobility" in categories
    
    def test_is_valid(self):
        assert PreferenceCategory.is_valid("dietary") is True
        assert PreferenceCategory.is_valid("invalid_category") is False
        assert PreferenceCategory.is_valid("") is False


class TestUserPreference:
    def test_creation(self):
        pref = UserPreference(
            preference_id="test123",
            category="dietary",
            value="不吃辣",
            source="chat"
        )
        assert pref.preference_id == "test123"
        assert pref.category == "dietary"
        assert pref.value == "不吃辣"
        assert pref.confidence == 1.0
        assert pref.usage_count == 0
    
    def test_confidence_clamping(self):
        pref = UserPreference(
            preference_id="test",
            category="dietary",
            value="test",
            source="test",
            confidence=1.5
        )
        assert pref.confidence == 1.0
        
        pref2 = UserPreference(
            preference_id="test",
            category="dietary",
            value="test",
            source="test",
            confidence=-0.5
        )
        assert pref2.confidence == 0.0
    
    def test_to_dict(self):
        pref = UserPreference(
            preference_id="test123",
            category="dietary",
            value="不吃辣",
            source="chat",
            confidence=0.9
        )
        result = pref.to_dict()
        assert result["preference_id"] == "test123"
        assert result["category"] == "dietary"
        assert result["value"] == "不吃辣"
        assert result["confidence"] == 0.9
        assert "created_at" in result
    
    def test_update_usage(self):
        pref = UserPreference(
            preference_id="test",
            category="dietary",
            value="test",
            source="test",
            confidence=0.5
        )
        pref.update_usage()
        assert pref.usage_count == 1
        assert pref.confidence == 0.6
        
        pref.update_usage()
        assert pref.usage_count == 2
        assert pref.confidence == 0.7
    
    def test_confidence_max_limit(self):
        pref = UserPreference(
            preference_id="test",
            category="dietary",
            value="test",
            source="test",
            confidence=0.95
        )
        pref.update_usage()
        assert pref.confidence == 1.0


class TestEmbeddingService:
    def test_simple_embedding(self):
        service = EmbeddingService(api_key=None)
        embedding = service.get_embedding("测试文本")
        
        assert isinstance(embedding, list)
        assert len(embedding) == 768
        assert all(isinstance(x, float) for x in embedding)
    
    def test_empty_text_embedding(self):
        service = EmbeddingService(api_key=None)
        embedding = service.get_embedding("")
        
        assert isinstance(embedding, list)
        assert len(embedding) == 768
    
    def test_none_text_embedding(self):
        service = EmbeddingService(api_key=None)
        embedding = service.get_embedding(None)
        
        assert isinstance(embedding, list)
        assert len(embedding) == 768
    
    def test_cosine_similarity_identical(self):
        service = EmbeddingService(api_key=None)
        vec = [0.5, 0.5, 0.5, 0.5]
        similarity = service.cosine_similarity(vec, vec)
        
        assert abs(similarity - 1.0) < 0.0001
    
    def test_cosine_similarity_orthogonal(self):
        service = EmbeddingService(api_key=None)
        vec1 = [1.0, 0.0]
        vec2 = [0.0, 1.0]
        similarity = service.cosine_similarity(vec1, vec2)
        
        assert abs(similarity) < 0.0001
    
    def test_cosine_similarity_empty_vectors(self):
        service = EmbeddingService(api_key=None)
        similarity = service.cosine_similarity([], [0.5, 0.5])
        assert similarity == 0.0
        
        similarity = service.cosine_similarity([0.5, 0.5], [])
        assert similarity == 0.0
    
    def test_embedding_cache(self):
        service = EmbeddingService(api_key=None)
        
        emb1 = service.get_embedding("测试")
        emb2 = service.get_embedding("测试")
        
        assert emb1 == emb2


class TestVectorStore:
    def test_add_and_get(self):
        embedding_service = EmbeddingService(api_key=None)
        store = VectorStore(embedding_service)
        
        store.add("id1", "测试文本", {"user_id": 1})
        
        result = store.get("id1")
        assert result is not None
        assert result["user_id"] == 1
        assert result["text"] == "测试文本"
    
    def test_delete(self):
        embedding_service = EmbeddingService(api_key=None)
        store = VectorStore(embedding_service)
        
        store.add("id1", "测试", {"user_id": 1})
        assert store.get("id1") is not None
        
        result = store.delete("id1")
        assert result is True
        assert store.get("id1") is None
    
    def test_delete_nonexistent(self):
        embedding_service = EmbeddingService(api_key=None)
        store = VectorStore(embedding_service)
        
        result = store.delete("nonexistent")
        assert result is False
    
    def test_search(self):
        embedding_service = EmbeddingService(api_key=None)
        store = VectorStore(embedding_service)
        
        store.add("id1", "饮食: 不吃辣", {"category": "dietary"})
        store.add("id2", "兴趣: 摄影", {"category": "interest"})
        
        results = store.search("饮食偏好", top_k=5, threshold=0.0)
        
        assert len(results) > 0
        assert all(isinstance(r, tuple) for r in results)
        assert all(len(r) == 3 for r in results)
    
    def test_search_empty_store(self):
        embedding_service = EmbeddingService(api_key=None)
        store = VectorStore(embedding_service)
        
        results = store.search("测试", top_k=5)
        assert results == []
    
    def test_clear(self):
        embedding_service = EmbeddingService(api_key=None)
        store = VectorStore(embedding_service)
        
        store.add("id1", "测试1", {})
        store.add("id2", "测试2", {})
        
        count = store.clear()
        assert count == 2
        assert len(store.vectors) == 0
    
    def test_invalid_id(self):
        embedding_service = EmbeddingService(api_key=None)
        store = VectorStore(embedding_service)
        
        with pytest.raises(InputValidationError):
            store.add(None, "test", {})
        
        with pytest.raises(InputValidationError):
            store.add("", "test", {})


class TestPreferenceExtractor:
    def test_rule_based_extract_dietary(self):
        extractor = PreferenceExtractor(api_key=None)
        
        result = extractor._rule_based_extract("我不吃辣，海鲜过敏")
        
        assert len(result) >= 2
        categories = [r["category"] for r in result]
        assert "dietary" in categories
    
    def test_rule_based_extract_companion(self):
        extractor = PreferenceExtractor(api_key=None)
        
        result = extractor._rule_based_extract("我带老人去旅游")
        
        assert len(result) >= 1
        assert any(r["category"] == "companion" for r in result)
    
    def test_rule_based_extract_multiple(self):
        extractor = PreferenceExtractor(api_key=None)
        
        result = extractor._rule_based_extract("我带老人去旅游，不吃辣，喜欢轻松的节奏")
        
        categories = [r["category"] for r in result]
        assert "companion" in categories
        assert "dietary" in categories
        assert "pace" in categories
    
    def test_rule_based_extract_no_match(self):
        extractor = PreferenceExtractor(api_key=None)
        
        result = extractor._rule_based_extract("今天天气真好")
        
        assert result == []
    
    def test_sanitize_input(self):
        extractor = PreferenceExtractor(api_key=None)
        
        result = extractor._sanitize_input("正常文本\x00\x1f测试")
        assert "\x00" not in result
        assert "\x1f" not in result
    
    def test_sanitize_input_length(self):
        extractor = PreferenceExtractor(api_key=None)
        
        long_text = "a" * 10000
        result = extractor._sanitize_input(long_text)
        assert len(result) <= 5000
    
    def test_validate_preferences(self):
        extractor = PreferenceExtractor(api_key=None)
        
        raw_prefs = [
            {"category": "dietary", "value": "不吃辣", "confidence": 0.9},
            {"category": "invalid", "value": "测试", "confidence": 0.8},
            {"category": "mobility", "value": "恐高", "confidence": "invalid"},
            {"category": None, "value": "测试"},
        ]
        
        result = extractor._validate_preferences(raw_prefs)
        
        assert len(result) == 2
        assert all(r["category"] in PreferenceCategory.all_categories() for r in result)
    
    def test_empty_input(self):
        extractor = PreferenceExtractor(api_key=None)
        
        result = asyncio.run(extractor.extract(""))
        assert result == []
        
        result = asyncio.run(extractor.extract(None))
        assert result == []


class TestUserProfileService:
    def test_get_user_preferences_empty(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        result = service.get_user_preferences(999)
        assert result == []
    
    def test_get_constraints_for_planning(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        service.user_profiles[1] = {
            "pref1": UserPreference(
                preference_id="pref1",
                category="dietary",
                value="不吃辣",
                source="chat"
            ),
            "pref2": UserPreference(
                preference_id="pref2",
                category="companion",
                value="带老人",
                source="chat"
            )
        }
        
        constraints = service.get_constraints_for_planning(1)
        
        assert "不吃辣" in constraints["dietary_restrictions"]
        assert constraints["companion_type"] == "带老人"
    
    def test_build_preference_context(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        service.user_profiles[1] = {
            "pref1": UserPreference(
                preference_id="pref1",
                category="dietary",
                value="不吃辣",
                source="chat"
            )
        }
        
        context = service.build_preference_context(1)
        
        assert "用户画像信息" in context
        assert "饮食偏好" in context
        assert "不吃辣" in context
    
    def test_build_preference_context_empty(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        context = service.build_preference_context(999)
        assert context == ""
    
    def test_remove_preference(self):
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.delete.return_value = 1
        mock_db.commit = Mock()
        
        service = UserProfileService(db=mock_db)
        service.user_profiles[1] = {
            "pref1": UserPreference(
                preference_id="pref1",
                category="dietary",
                value="不吃辣",
                source="chat"
            )
        }
        service._loaded = True
        
        result = service.remove_preference(1, "pref1")
        
        assert result is True
        assert "pref1" not in service.user_profiles.get(1, {})
    
    def test_remove_preference_nonexistent(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        result = service.remove_preference(999, "nonexistent")
        assert result is False
    
    def test_clear_user_profile(self):
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.first.return_value = Mock(id=1)
        mock_db.query.return_value.filter.return_value.delete.return_value = 2
        mock_db.commit = Mock()
        
        service = UserProfileService(db=mock_db)
        service.user_profiles[1] = {
            "pref1": UserPreference(
                preference_id="pref1",
                category="dietary",
                value="不吃辣",
                source="chat"
            ),
            "pref2": UserPreference(
                preference_id="pref2",
                category="mobility",
                value="恐高",
                source="chat"
            )
        }
        service._loaded = True
        
        count = service.clear_user_profile(1)
        
        assert count == 2
        assert 1 not in service.user_profiles
    
    def test_export_profile(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        service.user_profiles[1] = {
            "pref1": UserPreference(
                preference_id="pref1",
                category="dietary",
                value="不吃辣",
                source="chat"
            )
        }
        
        result = service.export_profile(1)
        
        assert result["user_id"] == 1
        assert len(result["preferences"]) == 1
        assert "summary" in result
        assert "exported_at" in result
    
    def test_import_profile(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        profile_data = {
            "preferences": [
                {
                    "preference_id": "import1",
                    "category": "dietary",
                    "value": "素食",
                    "confidence": 0.9,
                    "source": "import"
                }
            ]
        }
        
        count = service.import_profile(1, profile_data)
        
        assert count == 1
        assert 1 in service.user_profiles
    
    def test_import_profile_invalid_data(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        with pytest.raises(InputValidationError):
            service.import_profile(1, "invalid")
    
    def test_invalid_user_id(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        with pytest.raises(InputValidationError):
            asyncio.run(service.extract_and_store(-1, "测试"))
        
        with pytest.raises(InputValidationError):
            asyncio.run(service.extract_and_store("invalid", "测试"))
    
    def test_generate_preference_id_uniqueness(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        id1 = service._generate_preference_id(1, "dietary", "不吃辣")
        id2 = service._generate_preference_id(1, "dietary", "不吃辣")
        
        assert id1 != id2
        assert len(id1) == 16


class TestSearchRelevantPreferences:
    def test_search_with_embeddings(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        embedding_service = EmbeddingService(api_key=None)
        test_embedding = embedding_service.get_embedding("dietary: 不吃辣")
        
        service.user_profiles[1] = {
            "pref1": UserPreference(
                preference_id="pref1",
                category="dietary",
                value="不吃辣",
                source="chat",
                embedding=test_embedding
            )
        }
        
        results = service.search_relevant_preferences(1, "饮食偏好", top_k=5)
        
        assert len(results) > 0
        assert all(isinstance(r, tuple) and len(r) == 2 for r in results)
    
    def test_search_no_user_preferences(self):
        mock_db = Mock()
        service = UserProfileService(db=mock_db)
        
        results = service.search_relevant_preferences(999, "测试", top_k=5)
        assert results == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
