"""
数据库迁移脚本
从 SQLite 迁移到 PostgreSQL
"""
import os
import sys
import sqlite3
import logging
from datetime import datetime
from typing import List, Dict, Any
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseMigrator:
    def __init__(self, sqlite_path: str, postgres_url: str):
        self.sqlite_path = sqlite_path
        self.postgres_url = postgres_url
        self.stats = {
            "tables_migrated": 0,
            "records_migrated": 0,
            "errors": []
        }
    
    def connect_sqlite(self):
        return sqlite3.connect(self.sqlite_path)
    
    def connect_postgres(self):
        try:
            import psycopg2
            return psycopg2.connect(self.postgres_url)
        except ImportError:
            logger.error("请安装 psycopg2: pip install psycopg2-binary")
            return None
    
    def get_sqlite_tables(self) -> List[str]:
        conn = self.connect_sqlite()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [row[0] for row in cursor.fetchall()]
        conn.close()
        return tables
    
    def get_table_schema(self, table_name: str) -> List[Dict]:
        conn = self.connect_sqlite()
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = []
        for row in cursor.fetchall():
            columns.append({
                "cid": row[0],
                "name": row[1],
                "type": row[2],
                "notnull": row[3],
                "default": row[4],
                "pk": row[5]
            })
        conn.close()
        return columns
    
    def convert_type(self, sqlite_type: str) -> str:
        type_map = {
            "INTEGER": "INTEGER",
            "TEXT": "TEXT",
            "REAL": "DOUBLE PRECISION",
            "BLOB": "BYTEA",
            "DATETIME": "TIMESTAMP",
            "DATE": "DATE",
            "BOOLEAN": "BOOLEAN",
            "VARCHAR": "VARCHAR"
        }
        
        upper_type = sqlite_type.upper()
        for key, value in type_map.items():
            if key in upper_type:
                if "VARCHAR" in upper_type:
                    match = upper_type.replace("VARCHAR", "").strip("()")
                    if match:
                        return f"VARCHAR({match})"
                    return "VARCHAR(255)"
                return value
        
        return "TEXT"
    
    def create_postgres_table(self, table_name: str, columns: List[Dict]) -> bool:
        pg_conn = self.connect_postgres()
        if not pg_conn:
            return False
        
        try:
            cursor = pg_conn.cursor()
            
            column_defs = []
            primary_keys = []
            
            for col in columns:
                pg_type = self.convert_type(col["type"])
                col_def = f"{col['name']} {pg_type}"
                
                if col["notnull"]:
                    col_def += " NOT NULL"
                
                if col["default"] is not None:
                    col_def += f" DEFAULT {col['default']}"
                
                if col["pk"]:
                    primary_keys.append(col["name"])
                
                column_defs.append(col_def)
            
            create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(column_defs)}"
            
            if primary_keys:
                create_sql += f", PRIMARY KEY ({', '.join(primary_keys)})"
            
            create_sql += ")"
            
            cursor.execute(create_sql)
            pg_conn.commit()
            logger.info(f"创建表 {table_name} 成功")
            return True
            
        except Exception as e:
            logger.error(f"创建表 {table_name} 失败: {e}")
            self.stats["errors"].append(f"创建表 {table_name} 失败: {e}")
            return False
        finally:
            pg_conn.close()
    
    def migrate_table_data(self, table_name: str) -> int:
        sqlite_conn = self.connect_sqlite()
        pg_conn = self.connect_postgres()
        
        if not pg_conn:
            return 0
        
        try:
            sqlite_cursor = sqlite_conn.cursor()
            pg_cursor = pg_conn.cursor()
            
            sqlite_cursor.execute(f"SELECT * FROM {table_name}")
            rows = sqlite_cursor.fetchall()
            
            if not rows:
                return 0
            
            columns = [desc[0] for desc in sqlite_cursor.description]
            placeholders = ", ".join(["%s"] * len(columns))
            insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
            
            migrated = 0
            for row in rows:
                try:
                    converted_row = []
                    for value in row:
                        if isinstance(value, bytes):
                            converted_row.append(value.decode('utf-8', errors='replace'))
                        else:
                            converted_row.append(value)
                    
                    pg_cursor.execute(insert_sql, converted_row)
                    migrated += 1
                except Exception as e:
                    logger.warning(f"插入数据失败: {e}")
            
            pg_conn.commit()
            logger.info(f"表 {table_name} 迁移了 {migrated} 条记录")
            return migrated
            
        except Exception as e:
            logger.error(f"迁移表 {table_name} 数据失败: {e}")
            self.stats["errors"].append(f"迁移表 {table_name} 数据失败: {e}")
            return 0
        finally:
            sqlite_conn.close()
            pg_conn.close()
    
    def run_migration(self) -> Dict[str, Any]:
        logger.info("=" * 50)
        logger.info("开始数据库迁移")
        logger.info("=" * 50)
        
        tables = self.get_sqlite_tables()
        logger.info(f"发现 {len(tables)} 个表需要迁移")
        
        for table in tables:
            logger.info(f"\n处理表: {table}")
            
            columns = self.get_table_schema(table)
            if self.create_postgres_table(table, columns):
                migrated = self.migrate_table_data(table)
                self.stats["tables_migrated"] += 1
                self.stats["records_migrated"] += migrated
        
        logger.info("\n" + "=" * 50)
        logger.info("迁移完成")
        logger.info(f"迁移表数: {self.stats['tables_migrated']}")
        logger.info(f"迁移记录数: {self.stats['records_migrated']}")
        logger.info(f"错误数: {len(self.stats['errors'])}")
        logger.info("=" * 50)
        
        return self.stats


def main():
    sqlite_path = os.getenv("SQLITE_PATH", "./travel_planner.db")
    postgres_url = os.getenv(
        "POSTGRES_URL",
        "postgresql://postgres:postgres@localhost:5432/travel_planner"
    )
    
    print(f"""
数据库迁移工具
================

源数据库: {sqlite_path}
目标数据库: PostgreSQL

注意：请确保 PostgreSQL 数据库已创建，并且可以连接。

是否继续? (y/n): """)
    
    confirm = input().strip().lower()
    if confirm != 'y':
        print("迁移已取消")
        return
    
    migrator = DatabaseMigrator(sqlite_path, postgres_url)
    stats = migrator.run_migration()
    
    if stats["errors"]:
        print("\n迁移过程中出现以下错误:")
        for error in stats["errors"]:
            print(f"  - {error}")


if __name__ == "__main__":
    main()
