"""
测试脚本 - 验证所有新模块是否正常工作
"""
import sys
sys.path.insert(0, 'd:\\Trae\\trip\\travel-planner\\backend')

def test_imports():
    """测试模块导入"""
    print("测试模块导入...")
    
    try:
        from enhanced_models import Base, City, Attraction, Restaurant, Hotel, BusinessRule, Holiday
        print("✓ enhanced_models 导入成功")
    except Exception as e:
        print(f"✗ enhanced_models 导入失败: {e}")
        return False
    
    try:
        from rule_engine import RuleEngine, Rule, RuleCondition, RuleAction, RuleValidator
        print("✓ rule_engine 导入成功")
    except Exception as e:
        print(f"✗ rule_engine 导入失败: {e}")
        return False
    
    try:
        from calculation_service import TimeCalculator, DistanceCalculator, BudgetCalculator, CalculationService
        print("✓ calculation_service 导入成功")
    except Exception as e:
        print(f"✗ calculation_service 导入失败: {e}")
        return False
    
    try:
        from prompt_templates import PromptTemplateManager, PromptBuilder, get_output_format
        print("✓ prompt_templates 导入成功")
    except Exception as e:
        print(f"✗ prompt_templates 导入失败: {e}")
        return False
    
    try:
        from data_importer import DataImporter, DataValidator, export_to_excel, create_template_excel
        print("✓ data_importer 导入成功")
    except Exception as e:
        print(f"✗ data_importer 导入失败: {e}")
        return False
    
    try:
        from itinerary_service import ItineraryPlanningService
        print("✓ itinerary_service 导入成功")
    except Exception as e:
        print(f"✗ itinerary_service 导入失败: {e}")
        return False
    
    return True

def test_time_calculator():
    """测试时间计算器"""
    print("\n测试时间计算器...")
    from calculation_service import TimeCalculator
    
    result = TimeCalculator.time_diff_minutes("09:00", "18:00")
    assert result == 540, f"时间差计算错误: {result}"
    print(f"✓ 时间差计算: 09:00-18:00 = {result}分钟")
    
    result = TimeCalculator.add_minutes("09:00", 120)
    assert result == "11:00", f"时间加法错误: {result}"
    print(f"✓ 时间加法: 09:00 + 120分钟 = {result}")
    
    from datetime import date
    result = TimeCalculator.get_weekday_name(date(2026, 3, 2))
    assert result == "周一", f"星期计算错误: {result}"
    print(f"✓ 星期计算: 2026-03-02 = {result}")
    
    return True

def test_distance_calculator():
    """测试距离计算器"""
    print("\n测试距离计算器...")
    from calculation_service import DistanceCalculator
    
    dist = DistanceCalculator.haversine_distance(31.2304, 121.4737, 30.2741, 120.1551)
    print(f"✓ 上海到杭州距离: {dist:.1f}公里")
    
    time = DistanceCalculator.estimate_travel_time(dist, "high_speed_rail")
    print(f"✓ 估算高铁时间: {time}分钟")
    
    return True

def test_budget_calculator():
    """测试预算计算器"""
    print("\n测试预算计算器...")
    from calculation_service import BudgetCalculator
    
    attractions = [{"ticket_price": 100}, {"ticket_price": 50}]
    cost = BudgetCalculator.calculate_ticket_cost(attractions, 2)
    print(f"✓ 门票费用计算: {cost}元 (2人)")
    
    result = BudgetCalculator.check_budget_feasibility(2000, 1500)
    print(f"✓ 预算可行性: 预算{result['budget']}元, 估算{result['estimated_cost']}元, 可行={result['is_feasible']}")
    
    return True

def test_prompt_templates():
    """测试Prompt模板"""
    print("\n测试Prompt模板...")
    from prompt_templates import PromptTemplateManager
    
    manager = PromptTemplateManager()
    templates = manager.list_templates()
    print(f"✓ 已加载模板: {templates}")
    
    system_prompt = manager.render_template("system_base")
    print(f"✓ 系统提示词长度: {len(system_prompt)}字符")
    
    return True

def test_rule_engine():
    """测试规则引擎"""
    print("\n测试规则引擎...")
    from rule_engine import RuleCondition, RuleAction, Rule
    
    condition = RuleCondition("weekday", "周一")
    from datetime import date
    context = {"visit_date": date(2026, 3, 2)}
    result = condition.evaluate(context)
    print(f"✓ 条件评估: 周一闭馆规则在2026-03-02(周一) = {result}")
    
    context = {"visit_date": date(2026, 3, 3)}
    result = condition.evaluate(context)
    print(f"✓ 条件评估: 周一闭馆规则在2026-03-03(周二) = {result}")
    
    return True

def main():
    """主测试函数"""
    print("=" * 60)
    print("智能行程规划系统 - 模块测试")
    print("=" * 60)
    
    tests = [
        ("模块导入", test_imports),
        ("时间计算器", test_time_calculator),
        ("距离计算器", test_distance_calculator),
        ("预算计算器", test_budget_calculator),
        ("Prompt模板", test_prompt_templates),
        ("规则引擎", test_rule_engine),
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
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
