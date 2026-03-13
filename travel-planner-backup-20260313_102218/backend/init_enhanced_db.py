"""
数据库初始化脚本
创建增强版数据库表并导入初始数据
"""
import sys
sys.path.insert(0, 'd:\\Trae\\trip\\travel-planner\\backend')

from database import EnhancedSessionLocal, init_enhanced_db
from enhanced_models import (
    City, Attraction, Restaurant, Hotel, 
    TransportMatrix, BusinessRule, Holiday
)
import json
from datetime import datetime

def init_enhanced_database():
    """初始化增强版数据库"""
    print("=" * 60)
    print("初始化增强版数据库")
    print("=" * 60)
    
    print("\n创建数据库表...")
    init_enhanced_db()
    print("✓ 数据库表创建成功")
    
    from enhanced_data import (
        CITIES_DATA, ATTRACTIONS_DATA, RESTAURANTS_DATA,
        HOTELS_DATA, TRANSPORT_MATRIX_DATA, BUSINESS_RULES_DATA,
        HOLIDAYS_DATA
    )
    
    db = EnhancedSessionLocal()
    
    try:
        city_count = db.query(City).count()
        if city_count > 0:
            print("\n数据库已有数据，跳过导入")
            return
        
        print("\n导入城市数据...")
        for city_data in CITIES_DATA:
            city_data_copy = city_data.copy()
            city_data_copy["highlights"] = json.dumps(city_data_copy["highlights"], ensure_ascii=False)
            city = City(**city_data_copy)
            db.add(city)
        db.commit()
        print(f"✓ 已导入 {len(CITIES_DATA)} 个城市")
        
        city_map = {c.name: c.id for c in db.query(City).all()}
        
        print("\n导入景点数据...")
        for attr_data in ATTRACTIONS_DATA:
            attr_data_copy = attr_data.copy()
            attr_data_copy["city_id"] = city_map.get(attr_data_copy["city"])
            attraction = Attraction(**attr_data_copy)
            db.add(attraction)
        db.commit()
        print(f"✓ 已导入 {len(ATTRACTIONS_DATA)} 个景点")
        
        print("\n导入餐厅数据...")
        for rest_data in RESTAURANTS_DATA:
            rest_data_copy = rest_data.copy()
            rest_data_copy["city_id"] = city_map.get(rest_data_copy["city"])
            restaurant = Restaurant(**rest_data_copy)
            db.add(restaurant)
        db.commit()
        print(f"✓ 已导入 {len(RESTAURANTS_DATA)} 家餐厅")
        
        print("\n导入酒店数据...")
        for hotel_data in HOTELS_DATA:
            hotel_data_copy = hotel_data.copy()
            hotel_data_copy["city_id"] = city_map.get(hotel_data_copy["city"])
            hotel = Hotel(**hotel_data_copy)
            db.add(hotel)
        db.commit()
        print(f"✓ 已导入 {len(HOTELS_DATA)} 家酒店")
        
        print("\n导入交通数据...")
        for transport_data in TRANSPORT_MATRIX_DATA:
            transport = TransportMatrix(**transport_data)
            db.add(transport)
        db.commit()
        print(f"✓ 已导入 {len(TRANSPORT_MATRIX_DATA)} 条交通数据")
        
        print("\n导入业务规则数据...")
        for rule_data in BUSINESS_RULES_DATA:
            rule = BusinessRule(**rule_data)
            db.add(rule)
        db.commit()
        print(f"✓ 已导入 {len(BUSINESS_RULES_DATA)} 条业务规则")
        
        print("\n导入节假日数据...")
        for holiday_data in HOLIDAYS_DATA:
            holiday_data_copy = holiday_data.copy()
            holiday_data_copy["date"] = datetime.strptime(holiday_data_copy["date"], "%Y-%m-%d").date()
            holiday = Holiday(**holiday_data_copy)
            db.add(holiday)
        db.commit()
        print(f"✓ 已导入 {len(HOLIDAYS_DATA)} 个节假日")
        
        print("\n" + "=" * 60)
        print("数据库初始化完成！")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_enhanced_database()
