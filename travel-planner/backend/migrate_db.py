"""
数据库迁移脚本 - 添加景区模块新字段
"""
import sqlite3
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "travel_planner.db"

def migrate_database():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    cursor.execute("PRAGMA table_info(attractions)")
    columns = [col[1] for col in cursor.fetchall()]
    
    migrations = []
    
    if "platform_links" not in columns:
        migrations.append("ALTER TABLE attractions ADD COLUMN platform_links TEXT")
        print("添加 platform_links 字段...")
    
    if "images" not in columns:
        migrations.append("ALTER TABLE attractions ADD COLUMN images TEXT")
        print("添加 images 字段...")
    
    if "province" not in columns:
        migrations.append("ALTER TABLE attractions ADD COLUMN province VARCHAR(50)")
        print("添加 province 字段...")
    
    for sql in migrations:
        try:
            cursor.execute(sql)
            print(f"执行成功: {sql}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"字段已存在，跳过: {sql}")
            else:
                print(f"执行失败: {sql}, 错误: {e}")
    
    conn.commit()
    conn.close()
    
    print(f"\n迁移完成！共执行 {len(migrations)} 条语句")

if __name__ == "__main__":
    migrate_database()
