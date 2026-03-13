"""
数据库索引优化模块
自动创建和优化数据库索引，提升查询性能
"""
import logging
from sqlalchemy import text
from database import engine

logger = logging.getLogger(__name__)

INDEX_DEFINITIONS = [
    {
        "name": "idx_schedules_itinerary_day",
        "table": "schedules",
        "columns": "itinerary_id, day",
        "description": "优化按行程和日期查询日程"
    },
    {
        "name": "idx_schedules_itinerary_id",
        "table": "schedules",
        "columns": "itinerary_id",
        "description": "优化按行程ID查询日程"
    },
    {
        "name": "idx_attractions_city",
        "table": "attractions",
        "columns": "city",
        "description": "优化按城市查询景点"
    },
    {
        "name": "idx_attractions_category",
        "table": "attractions",
        "columns": "category",
        "description": "优化按类别查询景点"
    },
    {
        "name": "idx_itineraries_user_id",
        "table": "itineraries",
        "columns": "user_id",
        "description": "优化按用户查询行程"
    },
    {
        "name": "idx_itineraries_status",
        "table": "itineraries",
        "columns": "status",
        "description": "优化按状态查询行程"
    },
    {
        "name": "idx_itineraries_created_at",
        "table": "itineraries",
        "columns": "created_at",
        "description": "优化按创建时间排序"
    },
    {
        "name": "idx_users_username",
        "table": "users",
        "columns": "username",
        "description": "优化用户名查询"
    },
    {
        "name": "idx_users_email",
        "table": "users",
        "columns": "email",
        "description": "优化邮箱查询"
    }
]


def check_index_exists(index_name: str, table_name: str) -> bool:
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='index' AND name=:index_name"
            ), {"index_name": index_name})
            return result.fetchone() is not None
    except Exception as e:
        logger.error(f"检查索引 {index_name} 是否存在时出错: {e}")
        return False


def create_index(index_def: dict) -> bool:
    index_name = index_def["name"]
    table_name = index_def["table"]
    columns = index_def["columns"]
    
    if check_index_exists(index_name, table_name):
        logger.info(f"索引 {index_name} 已存在，跳过创建")
        return True
    
    try:
        with engine.connect() as conn:
            sql = f"CREATE INDEX {index_name} ON {table_name} ({columns})"
            conn.execute(text(sql))
            conn.commit()
        logger.info(f"成功创建索引 {index_name} - {index_def['description']}")
        return True
    except Exception as e:
        logger.error(f"创建索引 {index_name} 失败: {e}")
        return False


def optimize_database():
    logger.info("开始数据库索引优化...")
    
    success_count = 0
    fail_count = 0
    skip_count = 0
    
    for index_def in INDEX_DEFINITIONS:
        if check_index_exists(index_def["name"], index_def["table"]):
            skip_count += 1
            logger.info(f"索引 {index_def['name']} 已存在，跳过")
        else:
            if create_index(index_def):
                success_count += 1
            else:
                fail_count += 1
    
    try:
        with engine.connect() as conn:
            conn.execute(text("PRAGMA optimize"))
            conn.commit()
        logger.info("数据库优化命令执行成功")
    except Exception as e:
        logger.warning(f"执行 PRAGMA optimize 失败: {e}")
    
    logger.info(f"""
数据库索引优化完成:
- 新建索引: {success_count}
- 已存在跳过: {skip_count}
- 创建失败: {fail_count}
    """)
    
    return {
        "success": success_count,
        "skipped": skip_count,
        "failed": fail_count
    }


def analyze_query_performance():
    queries = [
        {
            "name": "行程列表查询",
            "sql": "EXPLAIN QUERY PLAN SELECT * FROM itineraries WHERE user_id = 1 ORDER BY created_at DESC"
        },
        {
            "name": "日程查询",
            "sql": "EXPLAIN QUERY PLAN SELECT * FROM schedules WHERE itinerary_id = 1 AND day = 1"
        },
        {
            "name": "景点城市查询",
            "sql": "EXPLAIN QUERY PLAN SELECT * FROM attractions WHERE city = '杭州'"
        }
    ]
    
    results = []
    
    with engine.connect() as conn:
        for query in queries:
            try:
                result = conn.execute(text(query["sql"]))
                plan = "\n".join([str(row) for row in result.fetchall()])
                results.append({
                    "name": query["name"],
                    "plan": plan
                })
            except Exception as e:
                results.append({
                    "name": query["name"],
                    "error": str(e)
                })
    
    return results


def get_database_stats():
    stats = {}
    
    try:
        with engine.connect() as conn:
            tables = ["users", "itineraries", "schedules", "attractions", "cities"]
            
            for table in tables:
                try:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.fetchone()[0]
                    stats[table] = {"count": count}
                except:
                    stats[table] = {"count": 0, "error": "表不存在"}
            
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='index'"
            ))
            indexes = [row[0] for row in result.fetchall()]
            stats["indexes"] = indexes
    except Exception as e:
        stats["error"] = str(e)
    
    return stats


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    print("\n" + "=" * 50)
    print("数据库优化工具")
    print("=" * 50 + "\n")
    
    print("当前数据库统计:")
    stats = get_database_stats()
    for table, info in stats.items():
        if table != "indexes":
            print(f"  {table}: {info.get('count', 0)} 条记录")
    
    print("\n执行索引优化...")
    result = optimize_database()
    
    print("\n查询性能分析:")
    analysis = analyze_query_performance()
    for item in analysis:
        print(f"\n{item['name']}:")
        if 'plan' in item:
            print(item['plan'])
        elif 'error' in item:
            print(f"错误: {item['error']}")
