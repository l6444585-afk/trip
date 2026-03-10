"""
数据导入工具
支持Excel、CSV格式的数据导入
包含数据校验和错误处理机制
"""
import pandas as pd
import json
from typing import List, Dict, Optional, Any
from datetime import datetime
from sqlalchemy.orm import Session
from pathlib import Path
import os

from enhanced_models import (
    Base, City, Attraction, Restaurant, Hotel, 
    TransportMatrix, BusinessRule, Holiday
)
from database import SessionLocal, engine


class DataValidator:
    """数据校验器"""
    
    @staticmethod
    def validate_coordinates(lat: float, lon: float) -> bool:
        if lat is None or lon is None:
            return False
        return 18.0 <= lat <= 54.0 and 73.0 <= lon <= 135.0
    
    @staticmethod
    def validate_time_format(time_str: str) -> bool:
        if not time_str:
            return True
        try:
            datetime.strptime(time_str, "%H:%M")
            return True
        except ValueError:
            return False
    
    @staticmethod
    def validate_price(price: Any) -> float:
        if price is None or pd.isna(price):
            return 0.0
        try:
            return float(price)
        except (ValueError, TypeError):
            return 0.0
    
    @staticmethod
    def validate_rating(rating: Any) -> float:
        if rating is None or pd.isna(rating):
            return 0.0
        try:
            r = float(rating)
            return max(0.0, min(5.0, r))
        except (ValueError, TypeError):
            return 0.0


class DataImporter:
    """数据导入器"""
    
    def __init__(self, db: Session):
        self.db = db
        self.validator = DataValidator()
        self.import_stats = {
            "cities": {"success": 0, "failed": 0, "errors": []},
            "attractions": {"success": 0, "failed": 0, "errors": []},
            "restaurants": {"success": 0, "failed": 0, "errors": []},
            "hotels": {"success": 0, "failed": 0, "errors": []},
            "transport": {"success": 0, "failed": 0, "errors": []},
            "rules": {"success": 0, "failed": 0, "errors": []},
            "holidays": {"success": 0, "failed": 0, "errors": []}
        }
    
    def import_from_excel(self, file_path: str) -> Dict:
        """从Excel文件导入数据"""
        result = {
            "success": True,
            "stats": self.import_stats,
            "message": ""
        }
        
        try:
            excel_file = pd.ExcelFile(file_path)
            sheet_names = excel_file.sheet_names
            
            if "城市" in sheet_names or "cities" in sheet_names:
                sheet_name = "城市" if "城市" in sheet_names else "cities"
                self._import_cities_from_df(pd.read_excel(file_path, sheet_name=sheet_name))
            
            if "景点" in sheet_names or "attractions" in sheet_names:
                sheet_name = "景点" if "景点" in sheet_names else "attractions"
                self._import_attractions_from_df(pd.read_excel(file_path, sheet_name=sheet_name))
            
            if "餐厅" in sheet_names or "restaurants" in sheet_names:
                sheet_name = "餐厅" if "餐厅" in sheet_names else "restaurants"
                self._import_restaurants_from_df(pd.read_excel(file_path, sheet_name=sheet_name))
            
            if "酒店" in sheet_names or "hotels" in sheet_names:
                sheet_name = "酒店" if "酒店" in sheet_names else "hotels"
                self._import_hotels_from_df(pd.read_excel(file_path, sheet_name=sheet_name))
            
            if "交通" in sheet_names or "transport" in sheet_names:
                sheet_name = "交通" if "交通" in sheet_names else "transport"
                self._import_transport_from_df(pd.read_excel(file_path, sheet_name=sheet_name))
            
            if "规则" in sheet_names or "rules" in sheet_names:
                sheet_name = "规则" if "规则" in sheet_names else "rules"
                self._import_rules_from_df(pd.read_excel(file_path, sheet_name=sheet_name))
            
            if "节假日" in sheet_names or "holidays" in sheet_names:
                sheet_name = "节假日" if "节假日" in sheet_names else "holidays"
                self._import_holidays_from_df(pd.read_excel(file_path, sheet_name=sheet_name))
            
            self.db.commit()
            
            total_success = sum(s["success"] for s in self.import_stats.values())
            total_failed = sum(s["failed"] for s in self.import_stats.values())
            
            result["message"] = f"导入完成：成功 {total_success} 条，失败 {total_failed} 条"
            
        except Exception as e:
            self.db.rollback()
            result["success"] = False
            result["message"] = f"导入失败：{str(e)}"
        
        return result
    
    def import_from_csv(self, directory: str) -> Dict:
        """从CSV文件目录导入数据"""
        result = {
            "success": True,
            "stats": self.import_stats,
            "message": ""
        }
        
        try:
            csv_files = {
                "cities": ["cities.csv", "城市.csv"],
                "attractions": ["attractions.csv", "景点.csv"],
                "restaurants": ["restaurants.csv", "餐厅.csv"],
                "hotels": ["hotels.csv", "酒店.csv"],
                "transport": ["transport.csv", "交通.csv"],
                "rules": ["rules.csv", "规则.csv"],
                "holidays": ["holidays.csv", "节假日.csv"]
            }
            
            for data_type, file_names in csv_files.items():
                for file_name in file_names:
                    file_path = os.path.join(directory, file_name)
                    if os.path.exists(file_path):
                        df = pd.read_csv(file_path, encoding='utf-8')
                        
                        if data_type == "cities":
                            self._import_cities_from_df(df)
                        elif data_type == "attractions":
                            self._import_attractions_from_df(df)
                        elif data_type == "restaurants":
                            self._import_restaurants_from_df(df)
                        elif data_type == "hotels":
                            self._import_hotels_from_df(df)
                        elif data_type == "transport":
                            self._import_transport_from_df(df)
                        elif data_type == "rules":
                            self._import_rules_from_df(df)
                        elif data_type == "holidays":
                            self._import_holidays_from_df(df)
                        break
            
            self.db.commit()
            
            total_success = sum(s["success"] for s in self.import_stats.values())
            total_failed = sum(s["failed"] for s in self.import_stats.values())
            
            result["message"] = f"导入完成：成功 {total_success} 条，失败 {total_failed} 条"
            
        except Exception as e:
            self.db.rollback()
            result["success"] = False
            result["message"] = f"导入失败：{str(e)}"
        
        return result
    
    def _import_cities_from_df(self, df: pd.DataFrame):
        """导入城市数据"""
        for _, row in df.iterrows():
            try:
                city = City(
                    name=str(row.get("name", row.get("名称", ""))),
                    province=str(row.get("province", row.get("省份", ""))),
                    latitude=float(row.get("latitude", row.get("纬度", 0))),
                    longitude=float(row.get("longitude", row.get("经度", 0))),
                    description=str(row.get("description", row.get("描述", ""))),
                    best_season=str(row.get("best_season", row.get("最佳季节", ""))),
                    avg_daily_cost=self.validator.validate_price(row.get("avg_daily_cost", row.get("日均消费", 0))),
                    highlights=json.dumps(row.get("highlights", row.get("亮点", [])), ensure_ascii=False) if isinstance(row.get("highlights", row.get("亮点")), list) else str(row.get("highlights", row.get("亮点", "")))
                )
                
                if not self.validator.validate_coordinates(city.latitude, city.longitude):
                    raise ValueError(f"无效的坐标：{city.latitude}, {city.longitude}")
                
                existing = self.db.query(City).filter(City.name == city.name).first()
                if existing:
                    for key, value in city.__dict__.items():
                        if key != '_sa_instance_state':
                            setattr(existing, key, value)
                else:
                    self.db.add(city)
                
                self.import_stats["cities"]["success"] += 1
                
            except Exception as e:
                self.import_stats["cities"]["failed"] += 1
                self.import_stats["cities"]["errors"].append(f"行 {_ + 1}: {str(e)}")
    
    def _import_attractions_from_df(self, df: pd.DataFrame):
        """导入景点数据"""
        city_map = {c.name: c.id for c in self.db.query(City).all()}
        
        for idx, row in df.iterrows():
            try:
                city_name = str(row.get("city", row.get("城市", "")))
                
                attraction = Attraction(
                    name=str(row.get("name", row.get("名称", ""))),
                    city=city_name,
                    city_id=city_map.get(city_name),
                    category=str(row.get("category", row.get("类别", "景点"))),
                    description=str(row.get("description", row.get("描述", ""))),
                    latitude=float(row.get("latitude", row.get("纬度", 0))),
                    longitude=float(row.get("longitude", row.get("经度", 0))),
                    address=str(row.get("address", row.get("地址", ""))),
                    rating=self.validator.validate_rating(row.get("rating", row.get("评分", 0))),
                    popularity=int(row.get("popularity", row.get("人气", 0)) or 0),
                    avg_visit_duration=int(row.get("avg_visit_duration", row.get("建议游玩时长", 120)) or 120),
                    recommended_duration_min=int(row.get("recommended_duration_min", row.get("最短时长", 60)) or 60),
                    recommended_duration_max=int(row.get("recommended_duration_max", row.get("最长时长", 240)) or 240),
                    open_time=str(row.get("open_time", row.get("开放时间", "08:00"))),
                    close_time=str(row.get("close_time", row.get("关闭时间", "18:00"))),
                    closed_days=str(row.get("closed_days", row.get("闭馆日", ""))),
                    open_time_weekend=str(row.get("open_time_weekend", row.get("周末开放时间", ""))) if pd.notna(row.get("open_time_weekend", row.get("周末开放时间"))) else None,
                    close_time_weekend=str(row.get("close_time_weekend", row.get("周末关闭时间", ""))) if pd.notna(row.get("close_time_weekend", row.get("周末关闭时间"))) else None,
                    ticket_price=self.validator.validate_price(row.get("ticket_price", row.get("门票价格", 0))),
                    ticket_price_peak=self.validator.validate_price(row.get("ticket_price_peak", row.get("旺季票价", 0))),
                    ticket_price_student=self.validator.validate_price(row.get("ticket_price_student", row.get("学生票价"))) if pd.notna(row.get("ticket_price_student", row.get("学生票价"))) else None,
                    ticket_price_senior=self.validator.validate_price(row.get("ticket_price_senior", row.get("老人票价"))) if pd.notna(row.get("ticket_price_senior", row.get("老人票价"))) else None,
                    ticket_price_child=self.validator.validate_price(row.get("ticket_price_child", row.get("儿童票价"))) if pd.notna(row.get("ticket_price_child", row.get("儿童票价"))) else None,
                    booking_required=bool(row.get("booking_required", row.get("需要预约", False))),
                    booking_advance_days=int(row.get("booking_advance_days", row.get("提前预约天数", 0)) or 0),
                    booking_url=str(row.get("booking_url", row.get("预约链接", ""))) if pd.notna(row.get("booking_url", row.get("预约链接"))) else None,
                    tags=str(row.get("tags", row.get("标签", ""))),
                    suitable_for=str(row.get("suitable_for", row.get("适合人群", ""))),
                    best_time_to_visit=str(row.get("best_time_to_visit", row.get("最佳游览时间", ""))),
                    peak_hours=str(row.get("peak_hours", row.get("高峰时段", "10:00-14:00"))),
                    indoor_outdoor=str(row.get("indoor_outdoor", row.get("室内外", "outdoor"))),
                    weather_sensitive=bool(row.get("weather_sensitive", row.get("天气敏感", True))),
                    wheelchair_accessible=bool(row.get("wheelchair_accessible", row.get("轮椅可通行", False))),
                    tips=str(row.get("tips", row.get("提示", ""))) if pd.notna(row.get("tips", row.get("提示"))) else None,
                    warnings=str(row.get("warnings", row.get("警告", ""))) if pd.notna(row.get("warnings", row.get("警告"))) else None,
                    data_quality_score=float(row.get("data_quality_score", row.get("数据质量分", 0.8))),
                    data_source=str(row.get("data_source", row.get("数据来源", "手动导入")))
                )
                
                if not self.validator.validate_coordinates(attraction.latitude, attraction.longitude):
                    raise ValueError(f"无效的坐标：{attraction.latitude}, {attraction.longitude}")
                
                existing = self.db.query(Attraction).filter(
                    Attraction.name == attraction.name,
                    Attraction.city == attraction.city
                ).first()
                
                if existing:
                    for key, value in attraction.__dict__.items():
                        if key != '_sa_instance_state':
                            setattr(existing, key, value)
                else:
                    self.db.add(attraction)
                
                self.import_stats["attractions"]["success"] += 1
                
            except Exception as e:
                self.import_stats["attractions"]["failed"] += 1
                self.import_stats["attractions"]["errors"].append(f"行 {idx + 1}: {str(e)}")
    
    def _import_restaurants_from_df(self, df: pd.DataFrame):
        """导入餐厅数据"""
        city_map = {c.name: c.id for c in self.db.query(City).all()}
        
        for idx, row in df.iterrows():
            try:
                city_name = str(row.get("city", row.get("城市", "")))
                
                restaurant = Restaurant(
                    name=str(row.get("name", row.get("名称", ""))),
                    city=city_name,
                    city_id=city_map.get(city_name),
                    address=str(row.get("address", row.get("地址", ""))),
                    latitude=float(row.get("latitude", row.get("纬度", 0))),
                    longitude=float(row.get("longitude", row.get("经度", 0))),
                    category=str(row.get("category", row.get("类别", ""))),
                    cuisine_type=str(row.get("cuisine_type", row.get("菜系", ""))),
                    price_level=int(row.get("price_level", row.get("价格等级", 2)) or 2),
                    avg_cost_per_person=self.validator.validate_price(row.get("avg_cost_per_person", row.get("人均消费", 0))),
                    rating=self.validator.validate_rating(row.get("rating", row.get("评分", 0))),
                    open_time=str(row.get("open_time", row.get("开放时间", "10:00"))),
                    close_time=str(row.get("close_time", row.get("关闭时间", "22:00"))),
                    closed_days=str(row.get("closed_days", row.get("休息日", ""))),
                    specialty_dishes=str(row.get("specialty_dishes", row.get("招牌菜", ""))),
                    suitable_for=str(row.get("suitable_for", row.get("适合人群", ""))),
                    tags=str(row.get("tags", row.get("标签", ""))),
                    phone=str(row.get("phone", row.get("电话", ""))) if pd.notna(row.get("phone", row.get("电话"))) else None,
                    reservation_required=bool(row.get("reservation_required", row.get("需要预约", False))),
                    tips=str(row.get("tips", row.get("提示", ""))) if pd.notna(row.get("tips", row.get("提示"))) else None
                )
                
                existing = self.db.query(Restaurant).filter(
                    Restaurant.name == restaurant.name,
                    Restaurant.city == restaurant.city
                ).first()
                
                if existing:
                    for key, value in restaurant.__dict__.items():
                        if key != '_sa_instance_state':
                            setattr(existing, key, value)
                else:
                    self.db.add(restaurant)
                
                self.import_stats["restaurants"]["success"] += 1
                
            except Exception as e:
                self.import_stats["restaurants"]["failed"] += 1
                self.import_stats["restaurants"]["errors"].append(f"行 {idx + 1}: {str(e)}")
    
    def _import_hotels_from_df(self, df: pd.DataFrame):
        """导入酒店数据"""
        city_map = {c.name: c.id for c in self.db.query(City).all()}
        
        for idx, row in df.iterrows():
            try:
                city_name = str(row.get("city", row.get("城市", "")))
                
                hotel = Hotel(
                    name=str(row.get("name", row.get("名称", ""))),
                    city=city_name,
                    city_id=city_map.get(city_name),
                    address=str(row.get("address", row.get("地址", ""))),
                    latitude=float(row.get("latitude", row.get("纬度", 0))),
                    longitude=float(row.get("longitude", row.get("经度", 0))),
                    hotel_type=str(row.get("hotel_type", row.get("酒店类型", "舒适型"))),
                    star_rating=int(row.get("star_rating", row.get("星级", 3)) or 3),
                    price_level=int(row.get("price_level", row.get("价格等级", 2)) or 2),
                    price_min=self.validator.validate_price(row.get("price_min", row.get("最低价格", 0))),
                    price_max=self.validator.validate_price(row.get("price_max", row.get("最高价格", 0))),
                    rating=self.validator.validate_rating(row.get("rating", row.get("评分", 0))),
                    amenities=str(row.get("amenities", row.get("设施", ""))),
                    suitable_for=str(row.get("suitable_for", row.get("适合人群", ""))),
                    tags=str(row.get("tags", row.get("标签", ""))),
                    phone=str(row.get("phone", row.get("电话", ""))) if pd.notna(row.get("phone", row.get("电话"))) else None,
                    tips=str(row.get("tips", row.get("提示", ""))) if pd.notna(row.get("tips", row.get("提示"))) else None
                )
                
                existing = self.db.query(Hotel).filter(
                    Hotel.name == hotel.name,
                    Hotel.city == hotel.city
                ).first()
                
                if existing:
                    for key, value in hotel.__dict__.items():
                        if key != '_sa_instance_state':
                            setattr(existing, key, value)
                else:
                    self.db.add(hotel)
                
                self.import_stats["hotels"]["success"] += 1
                
            except Exception as e:
                self.import_stats["hotels"]["failed"] += 1
                self.import_stats["hotels"]["errors"].append(f"行 {idx + 1}: {str(e)}")
    
    def _import_transport_from_df(self, df: pd.DataFrame):
        """导入交通数据"""
        for idx, row in df.iterrows():
            try:
                transport = TransportMatrix(
                    from_city=str(row.get("from_city", row.get("出发城市", ""))),
                    to_city=str(row.get("to_city", row.get("到达城市", ""))),
                    transport_type=str(row.get("transport_type", row.get("交通方式", "高铁"))),
                    duration_minutes=int(row.get("duration_minutes", row.get("时长分钟", 60)) or 60),
                    cost_min=self.validator.validate_price(row.get("cost_min", row.get("最低费用", 0))),
                    cost_max=self.validator.validate_price(row.get("cost_max", row.get("最高费用", 0))),
                    frequency=str(row.get("frequency", row.get("班次", ""))),
                    notes=str(row.get("notes", row.get("备注", ""))) if pd.notna(row.get("notes", row.get("备注"))) else None,
                    distance_km=float(row.get("distance_km", row.get("距离公里", 0))) if pd.notna(row.get("distance_km", row.get("距离公里"))) else None
                )
                
                existing = self.db.query(TransportMatrix).filter(
                    TransportMatrix.from_city == transport.from_city,
                    TransportMatrix.to_city == transport.to_city,
                    TransportMatrix.transport_type == transport.transport_type
                ).first()
                
                if existing:
                    for key, value in transport.__dict__.items():
                        if key != '_sa_instance_state':
                            setattr(existing, key, value)
                else:
                    self.db.add(transport)
                
                self.import_stats["transport"]["success"] += 1
                
            except Exception as e:
                self.import_stats["transport"]["failed"] += 1
                self.import_stats["transport"]["errors"].append(f"行 {idx + 1}: {str(e)}")
    
    def _import_rules_from_df(self, df: pd.DataFrame):
        """导入业务规则数据"""
        for idx, row in df.iterrows():
            try:
                rule = BusinessRule(
                    rule_type=str(row.get("rule_type", row.get("规则类型", ""))),
                    rule_name=str(row.get("rule_name", row.get("规则名称", ""))),
                    description=str(row.get("description", row.get("描述", ""))),
                    city=str(row.get("city", row.get("城市", ""))) if pd.notna(row.get("city", row.get("城市"))) else None,
                    condition_type=str(row.get("condition_type", row.get("条件类型", ""))),
                    condition_value=str(row.get("condition_value", row.get("条件值", ""))),
                    action_type=str(row.get("action_type", row.get("动作类型", ""))),
                    action_value=str(row.get("action_value", row.get("动作值", ""))),
                    priority=int(row.get("priority", row.get("优先级", 0)) or 0),
                    is_active=bool(row.get("is_active", row.get("是否启用", True)))
                )
                
                self.db.add(rule)
                self.import_stats["rules"]["success"] += 1
                
            except Exception as e:
                self.import_stats["rules"]["failed"] += 1
                self.import_stats["rules"]["errors"].append(f"行 {idx + 1}: {str(e)}")
    
    def _import_holidays_from_df(self, df: pd.DataFrame):
        """导入节假日数据"""
        for idx, row in df.iterrows():
            try:
                date_val = row.get("date", row.get("日期", ""))
                if isinstance(date_val, str):
                    date_val = datetime.strptime(date_val, "%Y-%m-%d").date()
                
                holiday = Holiday(
                    name=str(row.get("name", row.get("名称", ""))),
                    date=date_val,
                    is_public_holiday=bool(row.get("is_public_holiday", row.get("是否法定假日", True))),
                    affected_cities=str(row.get("affected_cities", row.get("影响城市", ""))) if pd.notna(row.get("affected_cities", row.get("影响城市"))) else None,
                    special_notes=str(row.get("special_notes", row.get("特别说明", ""))) if pd.notna(row.get("special_notes", row.get("特别说明"))) else None
                )
                
                existing = self.db.query(Holiday).filter(Holiday.date == holiday.date).first()
                if existing:
                    for key, value in holiday.__dict__.items():
                        if key != '_sa_instance_state':
                            setattr(existing, key, value)
                else:
                    self.db.add(holiday)
                
                self.import_stats["holidays"]["success"] += 1
                
            except Exception as e:
                self.import_stats["holidays"]["failed"] += 1
                self.import_stats["holidays"]["errors"].append(f"行 {idx + 1}: {str(e)}")


def export_to_excel(db: Session, output_path: str) -> Dict:
    """导出数据到Excel文件"""
    try:
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            cities = db.query(City).all()
            if cities:
                cities_df = pd.DataFrame([{
                    "名称": c.name,
                    "省份": c.province,
                    "纬度": c.latitude,
                    "经度": c.longitude,
                    "描述": c.description,
                    "最佳季节": c.best_season,
                    "日均消费": c.avg_daily_cost,
                    "亮点": c.highlights
                } for c in cities])
                cities_df.to_excel(writer, sheet_name="城市", index=False)
            
            attractions = db.query(Attraction).all()
            if attractions:
                attractions_df = pd.DataFrame([{
                    "名称": a.name,
                    "城市": a.city,
                    "类别": a.category,
                    "描述": a.description,
                    "纬度": a.latitude,
                    "经度": a.longitude,
                    "地址": a.address,
                    "评分": a.rating,
                    "建议游玩时长": a.avg_visit_duration,
                    "开放时间": a.open_time,
                    "关闭时间": a.close_time,
                    "闭馆日": a.closed_days,
                    "门票价格": a.ticket_price,
                    "旺季票价": a.ticket_price_peak,
                    "需要预约": a.booking_required,
                    "提前预约天数": a.booking_advance_days,
                    "预约链接": a.booking_url,
                    "标签": a.tags,
                    "适合人群": a.suitable_for,
                    "最佳游览时间": a.best_time_to_visit,
                    "高峰时段": a.peak_hours,
                    "室内外": a.indoor_outdoor,
                    "天气敏感": a.weather_sensitive,
                    "提示": a.tips,
                    "警告": a.warnings
                } for a in attractions])
                attractions_df.to_excel(writer, sheet_name="景点", index=False)
            
            restaurants = db.query(Restaurant).all()
            if restaurants:
                restaurants_df = pd.DataFrame([{
                    "名称": r.name,
                    "城市": r.city,
                    "地址": r.address,
                    "纬度": r.latitude,
                    "经度": r.longitude,
                    "类别": r.category,
                    "菜系": r.cuisine_type,
                    "价格等级": r.price_level,
                    "人均消费": r.avg_cost_per_person,
                    "评分": r.rating,
                    "开放时间": r.open_time,
                    "关闭时间": r.close_time,
                    "休息日": r.closed_days,
                    "招牌菜": r.specialty_dishes,
                    "适合人群": r.suitable_for,
                    "标签": r.tags,
                    "电话": r.phone,
                    "需要预约": r.reservation_required,
                    "提示": r.tips
                } for r in restaurants])
                restaurants_df.to_excel(writer, sheet_name="餐厅", index=False)
            
            transport = db.query(TransportMatrix).all()
            if transport:
                transport_df = pd.DataFrame([{
                    "出发城市": t.from_city,
                    "到达城市": t.to_city,
                    "交通方式": t.transport_type,
                    "时长分钟": t.duration_minutes,
                    "最低费用": t.cost_min,
                    "最高费用": t.cost_max,
                    "班次": t.frequency,
                    "备注": t.notes,
                    "距离公里": t.distance_km
                } for t in transport])
                transport_df.to_excel(writer, sheet_name="交通", index=False)
            
            rules = db.query(BusinessRule).all()
            if rules:
                rules_df = pd.DataFrame([{
                    "规则类型": r.rule_type,
                    "规则名称": r.rule_name,
                    "描述": r.description,
                    "城市": r.city,
                    "条件类型": r.condition_type,
                    "条件值": r.condition_value,
                    "动作类型": r.action_type,
                    "动作值": r.action_value,
                    "优先级": r.priority,
                    "是否启用": r.is_active
                } for r in rules])
                rules_df.to_excel(writer, sheet_name="规则", index=False)
        
        return {"success": True, "message": f"数据已导出到 {output_path}"}
    
    except Exception as e:
        return {"success": False, "message": f"导出失败：{str(e)}"}


def create_template_excel(output_path: str) -> Dict:
    """创建Excel模板文件"""
    try:
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            cities_template = pd.DataFrame(columns=[
                "名称", "省份", "纬度", "经度", "描述", "最佳季节", "日均消费", "亮点"
            ])
            cities_template.to_excel(writer, sheet_name="城市", index=False)
            
            attractions_template = pd.DataFrame(columns=[
                "名称", "城市", "类别", "描述", "纬度", "经度", "地址", "评分",
                "建议游玩时长", "开放时间", "关闭时间", "闭馆日", "门票价格", "旺季票价",
                "学生票价", "老人票价", "儿童票价", "需要预约", "提前预约天数", "预约链接",
                "标签", "适合人群", "最佳游览时间", "高峰时段", "室内外", "天气敏感",
                "轮椅可通行", "提示", "警告"
            ])
            attractions_template.to_excel(writer, sheet_name="景点", index=False)
            
            restaurants_template = pd.DataFrame(columns=[
                "名称", "城市", "地址", "纬度", "经度", "类别", "菜系",
                "价格等级", "人均消费", "评分", "开放时间", "关闭时间", "休息日",
                "招牌菜", "适合人群", "标签", "电话", "需要预约", "提示"
            ])
            restaurants_template.to_excel(writer, sheet_name="餐厅", index=False)
            
            hotels_template = pd.DataFrame(columns=[
                "名称", "城市", "地址", "纬度", "经度", "酒店类型", "星级",
                "价格等级", "最低价格", "最高价格", "评分", "设施", "适合人群",
                "标签", "电话", "提示"
            ])
            hotels_template.to_excel(writer, sheet_name="酒店", index=False)
            
            transport_template = pd.DataFrame(columns=[
                "出发城市", "到达城市", "交通方式", "时长分钟", "最低费用", "最高费用",
                "班次", "备注", "距离公里"
            ])
            transport_template.to_excel(writer, sheet_name="交通", index=False)
            
            rules_template = pd.DataFrame(columns=[
                "规则类型", "规则名称", "描述", "城市", "条件类型", "条件值",
                "动作类型", "动作值", "优先级", "是否启用"
            ])
            rules_template.to_excel(writer, sheet_name="规则", index=False)
            
            holidays_template = pd.DataFrame(columns=[
                "名称", "日期", "是否法定假日", "影响城市", "特别说明"
            ])
            holidays_template.to_excel(writer, sheet_name="节假日", index=False)
        
        return {"success": True, "message": f"模板已创建于 {output_path}"}
    
    except Exception as e:
        return {"success": False, "message": f"创建模板失败：{str(e)}"}


if __name__ == "__main__":
    db = SessionLocal()
    try:
        template_path = "data_template.xlsx"
        result = create_template_excel(template_path)
        print(result["message"])
    finally:
        db.close()
