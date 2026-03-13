"""
API测试脚本
验证新端点是否正常工作
"""
import httpx
import json

BASE_URL = "http://localhost:8001"

def test_root():
    """测试根端点"""
    print("测试根端点...")
    try:
        response = httpx.get(f"{BASE_URL}/")
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_rule_types():
    """测试规则类型端点"""
    print("\n测试规则类型端点...")
    try:
        response = httpx.get(f"{BASE_URL}/api/rules/types/list")
        print(f"状态码: {response.status_code}")
        data = response.json()
        print(f"规则类型: {data.get('rule_types', [])}")
        print(f"条件类型: {data.get('condition_types', [])}")
        print(f"动作类型: {data.get('action_types', [])}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_list_rules():
    """测试规则列表端点"""
    print("\n测试规则列表端点...")
    try:
        response = httpx.get(f"{BASE_URL}/api/rules/")
        print(f"状态码: {response.status_code}")
        data = response.json()
        print(f"规则数量: {len(data)}")
        if data:
            print(f"第一个规则: {data[0].get('rule_name', 'N/A')}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_date_check():
    """测试日期检查端点"""
    print("\n测试日期检查端点...")
    try:
        response = httpx.get(f"{BASE_URL}/api/rules/check/2026-03-02")
        print(f"状态码: {response.status_code}")
        data = response.json()
        print(f"日期: {data.get('date')}")
        print(f"星期: {data.get('weekday')}")
        print(f"是否周末: {data.get('is_weekend')}")
        print(f"是否节假日: {data.get('is_holiday')}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_holidays():
    """测试节假日列表端点"""
    print("\n测试节假日列表端点...")
    try:
        response = httpx.get(f"{BASE_URL}/api/rules/holidays/?year=2026")
        print(f"状态码: {response.status_code}")
        data = response.json()
        print(f"节假日数量: {len(data)}")
        if data:
            print(f"节假日列表: {[h.get('name') for h in data[:3]]}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_attractions():
    """测试景点列表端点"""
    print("\n测试景点列表端点...")
    try:
        response = httpx.get(f"{BASE_URL}/api/attractions/?limit=5")
        print(f"状态码: {response.status_code}")
        data = response.json()
        print(f"景点数量: {len(data)}")
        if data:
            print(f"景点名称: {[a.get('name') for a in data[:3]]}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def main():
    print("=" * 60)
    print("智能行程规划系统 - API测试")
    print("=" * 60)
    
    tests = [
        ("根端点", test_root),
        ("规则类型", test_rule_types),
        ("规则列表", test_list_rules),
        ("日期检查", test_date_check),
        ("节假日列表", test_holidays),
        ("景点列表", test_attractions),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"✗ {name}测试失败: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"测试结果: 通过 {passed}/{len(tests)}, 失败 {failed}/{len(tests)}")
    print("=" * 60)

if __name__ == "__main__":
    main()
