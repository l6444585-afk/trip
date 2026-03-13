from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, JSON, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)

user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('admin_users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True)
)

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    real_name = Column(String(50))
    phone = Column(String(20))
    avatar = Column(String(500))
    status = Column(Integer, default=1)
    is_superuser = Column(Boolean, default=False)
    last_login = Column(DateTime)
    last_login_ip = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    operation_logs = relationship("OperationLog", back_populates="operator")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(String(200))
    status = Column(Integer, default=1)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    users = relationship("AdminUser", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    code = Column(String(100), unique=True, nullable=False)
    type = Column(String(20), default='menu')
    parent_id = Column(Integer, ForeignKey('permissions.id'), nullable=True)
    path = Column(String(200))
    icon = Column(String(50))
    component = Column(String(200))
    sort_order = Column(Integer, default=0)
    status = Column(Integer, default=1)
    api_path = Column(String(200))
    method = Column(String(10))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")
    children = relationship("Permission", backref="parent", remote_side=[id])

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, nullable=False)
    itinerary_id = Column(Integer, nullable=True)
    
    title = Column(String(200))
    type = Column(String(20), default='itinerary')
    
    total_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    
    status = Column(String(20), default='pending')
    payment_status = Column(String(20), default='unpaid')
    payment_method = Column(String(20))
    payment_time = Column(DateTime)
    transaction_id = Column(String(100))
    
    contact_name = Column(String(50))
    contact_phone = Column(String(20))
    contact_email = Column(String(100))
    
    travel_date = Column(DateTime)
    traveler_count = Column(Integer, default=1)
    special_requests = Column(Text)
    
    refund_status = Column(String(20), default='none')
    refund_reason = Column(Text)
    refund_amount = Column(Float, default=0.0)
    refund_time = Column(DateTime)
    
    remark = Column(Text)
    extra_data = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class OperationLog(Base):
    __tablename__ = "operation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey('admin_users.id'))
    operator_name = Column(String(50))
    operator_ip = Column(String(50))
    
    module = Column(String(50))
    action = Column(String(50))
    target_type = Column(String(50))
    target_id = Column(Integer)
    target_name = Column(String(200))
    
    description = Column(Text)
    request_method = Column(String(10))
    request_url = Column(String(500))
    request_params = Column(Text)
    response_code = Column(Integer)
    response_msg = Column(Text)
    
    status = Column(Integer, default=1)
    error_msg = Column(Text)
    duration_ms = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    operator = relationship("AdminUser", back_populates="operation_logs")

class SystemConfig(Base):
    __tablename__ = "system_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    group = Column(String(50), index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text)
    type = Column(String(20), default='text')
    description = Column(String(200))
    sort_order = Column(Integer, default=0)
    status = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DataBackup(Base):
    __tablename__ = "data_backups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), default='manual')
    file_path = Column(String(500))
    file_size = Column(Integer)
    tables = Column(Text)
    status = Column(String(20), default='pending')
    error_msg = Column(Text)
    operator_id = Column(Integer, ForeignKey('admin_users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemMetric(Base):
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    metric_type = Column(String(50), index=True)
    metric_name = Column(String(100))
    metric_value = Column(Float)
    unit = Column(String(20))
    tags = Column(JSON)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)

class OnlineUser(Base):
    __tablename__ = "online_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    user_type = Column(String(20), default='user')
    session_id = Column(String(100), unique=True, index=True)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    login_time = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    page_url = Column(String(500))

class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(20), default='notice')
    priority = Column(Integer, default=0)
    status = Column(Integer, default=0)
    publish_time = Column(DateTime)
    expire_time = Column(DateTime)
    target_users = Column(String(50), default='all')
    view_count = Column(Integer, default=0)
    creator_id = Column(Integer, ForeignKey('admin_users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    type = Column(String(20), default='suggestion')
    title = Column(String(200))
    content = Column(Text, nullable=False)
    images = Column(Text)
    contact = Column(String(100))
    status = Column(String(20), default='pending')
    reply = Column(Text)
    reply_time = Column(DateTime)
    reply_user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ItineraryReview(Base):
    __tablename__ = "itinerary_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, nullable=False)
    reviewer_id = Column(Integer, nullable=True)
    status = Column(String(20), default='pending')
    review_comment = Column(Text)
    reviewed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class AttractionMedia(Base):
    __tablename__ = "attraction_media"
    
    id = Column(Integer, primary_key=True, index=True)
    attraction_id = Column(Integer, nullable=False)
    type = Column(String(20), default='image')
    url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500))
    title = Column(String(200))
    description = Column(Text)
    sort_order = Column(Integer, default=0)
    status = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class DataExportTask(Base):
    __tablename__ = "data_export_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20))
    parameters = Column(JSON)
    file_path = Column(String(500))
    file_size = Column(Integer)
    status = Column(String(20), default='pending')
    progress = Column(Integer, default=0)
    total_rows = Column(Integer)
    exported_rows = Column(Integer, default=0)
    error_msg = Column(Text)
    operator_id = Column(Integer, nullable=True)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    expire_at = Column(DateTime)

def init_admin_data(db):
    from auth_utils import get_password_hash
    
    admin_role = db.query(Role).filter(Role.code == 'admin').first()
    if not admin_role:
        admin_role = Role(
            name='超级管理员',
            code='admin',
            description='系统超级管理员，拥有所有权限',
            status=1,
            sort_order=1
        )
        db.add(admin_role)
        db.commit()
    
    editor_role = db.query(Role).filter(Role.code == 'editor').first()
    if not editor_role:
        editor_role = Role(
            name='内容编辑',
            code='editor',
            description='负责行程和景点内容管理',
            status=1,
            sort_order=2
        )
        db.add(editor_role)
        db.commit()
    
    operator_role = db.query(Role).filter(Role.code == 'operator').first()
    if not operator_role:
        operator_role = Role(
            name='运营人员',
            code='operator',
            description='负责订单处理和客户服务',
            status=1,
            sort_order=3
        )
        db.add(operator_role)
        db.commit()
    
    admin_user = db.query(AdminUser).filter(AdminUser.username == 'admin').first()
    if not admin_user:
        admin_user = AdminUser(
            username='admin',
            email='admin@travel.local',
            password=get_password_hash('admin123'),
            real_name='系统管理员',
            status=1,
            is_superuser=True
        )
        admin_user.roles.append(admin_role)
        db.add(admin_user)
        db.commit()
        print("管理员账户创建成功: admin / admin123")
    
    permissions_data = [
        {'name': '用户管理', 'code': 'user', 'type': 'menu', 'icon': 'UserOutlined', 'path': '/admin/users', 'sort_order': 1},
        {'name': '用户列表', 'code': 'user:list', 'type': 'button', 'parent_code': 'user', 'api_path': '/api/admin/users', 'method': 'GET'},
        {'name': '用户创建', 'code': 'user:create', 'type': 'button', 'parent_code': 'user', 'api_path': '/api/admin/users', 'method': 'POST'},
        {'name': '用户编辑', 'code': 'user:edit', 'type': 'button', 'parent_code': 'user', 'api_path': '/api/admin/users/*', 'method': 'PUT'},
        {'name': '用户删除', 'code': 'user:delete', 'type': 'button', 'parent_code': 'user', 'api_path': '/api/admin/users/*', 'method': 'DELETE'},
        
        {'name': '行程管理', 'code': 'itinerary', 'type': 'menu', 'icon': 'ScheduleOutlined', 'path': '/admin/itineraries', 'sort_order': 2},
        {'name': '行程列表', 'code': 'itinerary:list', 'type': 'button', 'parent_code': 'itinerary'},
        {'name': '行程审核', 'code': 'itinerary:review', 'type': 'button', 'parent_code': 'itinerary'},
        {'name': '行程发布', 'code': 'itinerary:publish', 'type': 'button', 'parent_code': 'itinerary'},
        
        {'name': '景点管理', 'code': 'attraction', 'type': 'menu', 'icon': 'EnvironmentOutlined', 'path': '/admin/attractions', 'sort_order': 3},
        {'name': '景点列表', 'code': 'attraction:list', 'type': 'button', 'parent_code': 'attraction'},
        {'name': '景点创建', 'code': 'attraction:create', 'type': 'button', 'parent_code': 'attraction'},
        {'name': '景点编辑', 'code': 'attraction:edit', 'type': 'button', 'parent_code': 'attraction'},
        {'name': '景点删除', 'code': 'attraction:delete', 'type': 'button', 'parent_code': 'attraction'},
        
        {'name': '订单管理', 'code': 'order', 'type': 'menu', 'icon': 'ShoppingCartOutlined', 'path': '/admin/orders', 'sort_order': 4},
        {'name': '订单列表', 'code': 'order:list', 'type': 'button', 'parent_code': 'order'},
        {'name': '订单处理', 'code': 'order:process', 'type': 'button', 'parent_code': 'order'},
        {'name': '退款处理', 'code': 'order:refund', 'type': 'button', 'parent_code': 'order'},
        
        {'name': '数据分析', 'code': 'analytics', 'type': 'menu', 'icon': 'BarChartOutlined', 'path': '/admin/analytics', 'sort_order': 5},
        {'name': '数据导出', 'code': 'analytics:export', 'type': 'button', 'parent_code': 'analytics'},
        
        {'name': '系统设置', 'code': 'system', 'type': 'menu', 'icon': 'SettingOutlined', 'path': '/admin/settings', 'sort_order': 6},
        {'name': '角色管理', 'code': 'system:role', 'type': 'button', 'parent_code': 'system'},
        {'name': '权限管理', 'code': 'system:permission', 'type': 'button', 'parent_code': 'system'},
        {'name': '操作日志', 'code': 'system:log', 'type': 'button', 'parent_code': 'system'},
        {'name': '数据备份', 'code': 'system:backup', 'type': 'button', 'parent_code': 'system'},
    ]
    
    for perm_data in permissions_data:
        existing = db.query(Permission).filter(Permission.code == perm_data['code']).first()
        if not existing:
            parent_id = None
            if 'parent_code' in perm_data:
                parent = db.query(Permission).filter(Permission.code == perm_data['parent_code']).first()
                if parent:
                    parent_id = parent.id
            
            permission = Permission(
                name=perm_data['name'],
                code=perm_data['code'],
                type=perm_data.get('type', 'button'),
                parent_id=parent_id,
                icon=perm_data.get('icon'),
                path=perm_data.get('path'),
                api_path=perm_data.get('api_path'),
                method=perm_data.get('method'),
                sort_order=perm_data.get('sort_order', 0),
                status=1
            )
            db.add(permission)
    
    db.commit()
    print("权限数据初始化完成")
