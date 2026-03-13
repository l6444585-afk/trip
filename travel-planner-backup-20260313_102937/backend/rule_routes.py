"""
规则管理API路由
提供规则的增删改查和管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pydantic import BaseModel

from database import get_enhanced_db
from enhanced_models import BusinessRule, Holiday, Attraction
from rule_engine import RuleEngine, RuleValidator, ScheduleValidator


router = APIRouter(prefix="/api/rules", tags=["规则管理"])


class RuleCreate(BaseModel):
    rule_type: str
    rule_name: str
    description: Optional[str] = None
    condition_type: str
    condition_value: str
    action_type: str
    action_value: str
    priority: int = 0
    city: Optional[str] = None
    attraction_id: Optional[int] = None


class RuleUpdate(BaseModel):
    rule_type: Optional[str] = None
    rule_name: Optional[str] = None
    description: Optional[str] = None
    condition_type: Optional[str] = None
    condition_value: Optional[str] = None
    action_type: Optional[str] = None
    action_value: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    city: Optional[str] = None
    attraction_id: Optional[int] = None


class RuleResponse(BaseModel):
    id: int
    rule_type: str
    rule_name: str
    description: Optional[str]
    condition_type: str
    condition_value: str
    action_type: str
    action_value: str
    priority: int
    is_active: bool
    city: Optional[str]
    attraction_id: Optional[int]
    
    class Config:
        from_attributes = True


class HolidayCreate(BaseModel):
    name: str
    date: date
    is_public_holiday: bool = True
    affected_cities: Optional[str] = None
    special_notes: Optional[str] = None


class HolidayResponse(BaseModel):
    id: int
    name: str
    date: date
    is_public_holiday: bool
    affected_cities: Optional[str]
    special_notes: Optional[str]
    
    class Config:
        from_attributes = True


class AttractionEvaluationRequest(BaseModel):
    attraction_id: int
    visit_date: date
    visit_time: Optional[str] = None


class AttractionEvaluationResponse(BaseModel):
    attraction_id: int
    attraction_name: str
    is_available: bool
    excluded: bool
    warnings: List[str]
    adjustments: dict
    applied_rules: List[dict]


class ScheduleValidationRequest(BaseModel):
    schedule: List[dict]
    start_date: date


@router.get("/", response_model=List[RuleResponse])
async def list_rules(
    rule_type: Optional[str] = None,
    city: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_enhanced_db)
):
    """获取规则列表"""
    query = db.query(BusinessRule)
    
    if rule_type:
        query = query.filter(BusinessRule.rule_type == rule_type)
    if city:
        query = query.filter(BusinessRule.city == city)
    if is_active is not None:
        query = query.filter(BusinessRule.is_active == is_active)
    
    return query.order_by(BusinessRule.priority.desc()).all()


@router.get("/{rule_id}", response_model=RuleResponse)
async def get_rule(rule_id: int, db: Session = Depends(get_enhanced_db)):
    """获取单个规则"""
    rule = db.query(BusinessRule).filter(BusinessRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    return rule


@router.post("/", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(rule_data: RuleCreate, db: Session = Depends(get_enhanced_db)):
    """创建规则"""
    validation = RuleValidator.validate_rule_data(rule_data.model_dump())
    if not validation["is_valid"]:
        raise HTTPException(status_code=400, detail=validation["errors"])
    
    rule_engine = RuleEngine(db)
    rule = rule_engine.add_rule(
        rule_type=rule_data.rule_type,
        rule_name=rule_data.rule_name,
        condition_type=rule_data.condition_type,
        condition_value=rule_data.condition_value,
        action_type=rule_data.action_type,
        action_value=rule_data.action_value,
        priority=rule_data.priority,
        city=rule_data.city,
        attraction_id=rule_data.attraction_id,
        description=rule_data.description
    )
    
    return rule


@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(rule_id: int, rule_data: RuleUpdate, db: Session = Depends(get_enhanced_db)):
    """更新规则"""
    rule_engine = RuleEngine(db)
    
    updates = {k: v for k, v in rule_data.model_dump().items() if v is not None}
    rule = rule_engine.update_rule(rule_id, updates)
    
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    
    return rule


@router.delete("/{rule_id}")
async def delete_rule(rule_id: int, db: Session = Depends(get_enhanced_db)):
    """删除规则"""
    rule_engine = RuleEngine(db)
    
    if not rule_engine.delete_rule(rule_id):
        raise HTTPException(status_code=404, detail="规则不存在")
    
    return {"message": "规则删除成功"}


@router.post("/{rule_id}/toggle")
async def toggle_rule(rule_id: int, is_active: bool, db: Session = Depends(get_enhanced_db)):
    """启用/禁用规则"""
    rule_engine = RuleEngine(db)
    rule = rule_engine.toggle_rule(rule_id, is_active)
    
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    
    return {"message": f"规则已{'启用' if is_active else '禁用'}", "rule": rule}


@router.get("/types/list")
async def list_rule_types():
    """获取规则类型列表"""
    from rule_engine import RuleType, ConditionType, ActionType
    
    return {
        "rule_types": [rt.value for rt in RuleType],
        "condition_types": [ct.value for ct in ConditionType],
        "action_types": [at.value for at in ActionType]
    }


@router.post("/validate", response_model=dict)
async def validate_rule_data(rule_data: RuleCreate):
    """验证规则数据"""
    validation = RuleValidator.validate_rule_data(rule_data.model_dump())
    return validation


@router.post("/evaluate/attraction", response_model=AttractionEvaluationResponse)
async def evaluate_attraction(request: AttractionEvaluationRequest, db: Session = Depends(get_enhanced_db)):
    """评估景点规则"""
    attraction = db.query(Attraction).filter(Attraction.id == request.attraction_id).first()
    if not attraction:
        raise HTTPException(status_code=404, detail="景点不存在")
    
    rule_engine = RuleEngine(db)
    result = rule_engine.evaluate_attraction(attraction, request.visit_date, request.visit_time)
    
    return result


@router.post("/validate/schedule")
async def validate_schedule(request: ScheduleValidationRequest, db: Session = Depends(get_enhanced_db)):
    """验证日程"""
    rule_engine = RuleEngine(db)
    validator = ScheduleValidator(rule_engine)
    
    result = validator.validate_schedule(request.schedule, request.start_date)
    
    return result


@router.get("/holidays/", response_model=List[HolidayResponse])
async def list_holidays(
    year: Optional[int] = None,
    db: Session = Depends(get_enhanced_db)
):
    """获取节假日列表"""
    query = db.query(Holiday)
    
    if year:
        from datetime import date as date_type
        start_date = date_type(year, 1, 1)
        end_date = date_type(year, 12, 31)
        query = query.filter(Holiday.date >= start_date, Holiday.date <= end_date)
    
    return query.order_by(Holiday.date).all()


@router.post("/holidays/", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
async def create_holiday(holiday_data: HolidayCreate, db: Session = Depends(get_enhanced_db)):
    """创建节假日"""
    existing = db.query(Holiday).filter(Holiday.date == holiday_data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="该日期已存在节假日记录")
    
    holiday = Holiday(**holiday_data.model_dump())
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    
    return holiday


@router.put("/holidays/{holiday_id}", response_model=HolidayResponse)
async def update_holiday(holiday_id: int, holiday_data: HolidayCreate, db: Session = Depends(get_enhanced_db)):
    """更新节假日"""
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="节假日不存在")
    
    for key, value in holiday_data.model_dump().items():
        setattr(holiday, key, value)
    
    db.commit()
    db.refresh(holiday)
    
    return holiday


@router.delete("/holidays/{holiday_id}")
async def delete_holiday(holiday_id: int, db: Session = Depends(get_enhanced_db)):
    """删除节假日"""
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="节假日不存在")
    
    db.delete(holiday)
    db.commit()
    
    return {"message": "节假日删除成功"}


@router.get("/check/{visit_date}")
async def check_date_status(visit_date: date, db: Session = Depends(get_enhanced_db)):
    """检查日期状态（是否节假日、周末等）"""
    rule_engine = RuleEngine(db)
    holiday_info = rule_engine.get_holiday_info(visit_date)
    
    is_weekend = visit_date.weekday() >= 5
    
    return {
        "date": visit_date.isoformat(),
        "weekday": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][visit_date.weekday()],
        "is_weekend": is_weekend,
        "is_holiday": holiday_info is not None,
        "holiday_info": holiday_info
    }


@router.get("/attractions/{attraction_id}/rules")
async def get_attraction_rules(attraction_id: int, db: Session = Depends(get_enhanced_db)):
    """获取景点相关的所有规则"""
    attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attraction:
        raise HTTPException(status_code=404, detail="景点不存在")
    
    rules = db.query(BusinessRule).filter(
        (BusinessRule.attraction_id == attraction_id) | 
        (BusinessRule.city == attraction.city) |
        (BusinessRule.attraction_id == None) & (BusinessRule.city == None)
    ).filter(BusinessRule.is_active == True).all()
    
    return {
        "attraction_id": attraction_id,
        "attraction_name": attraction.name,
        "city": attraction.city,
        "rules": [
            {
                "id": r.id,
                "rule_type": r.rule_type,
                "rule_name": r.rule_name,
                "description": r.description,
                "condition_type": r.condition_type,
                "condition_value": r.condition_value,
                "action_type": r.action_type,
                "action_value": r.action_value
            }
            for r in rules
        ]
    }
