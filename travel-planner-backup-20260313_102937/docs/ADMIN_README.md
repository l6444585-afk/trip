# 江浙沪旅游行程规划系统 - 管理端

## 系统概述

管理端是江浙沪旅游行程规划系统的核心管理平台，提供用户管理、行程管理、景点管理、订单管理、数据分析等全方位的管理功能。

## 技术架构

### 后端技术栈
- **框架**: FastAPI (Python)
- **数据库**: SQLite (可扩展至 PostgreSQL/MySQL)
- **认证**: JWT Token
- **API文档**: Swagger UI

### 前端技术栈
- **框架**: React 18
- **UI组件库**: Ant Design 5
- **图表库**: @ant-design/charts
- **路由**: React Router 6
- **HTTP客户端**: Axios

## 功能模块

### 1. 仪表盘 (Dashboard)
- 系统核心数据统计展示
- 用户增长趋势图表
- 收入趋势分析
- 订单数量统计
- 热门行程排行

### 2. 用户管理
- 用户列表查询（支持搜索、筛选）
- 用户详情查看
- 用户状态管理（启用/禁用）
- 用户偏好信息查看

### 3. 行程管理
- 行程列表管理
- 行程审核功能（通过/拒绝）
- 行程发布/下架
- 行程详情查看

### 4. 景点管理
- 景点信息CRUD操作
- 景点分类管理
- 多媒体资源管理
- 景点搜索筛选

### 5. 订单管理
- 订单列表查询
- 订单状态更新
- 退款处理
- 订单详情查看

### 6. 数据分析
- 收入趋势分析
- 用户行为分析
- 订单数据分析
- 热门排行统计
- 数据导出功能

### 7. 系统设置
- **管理员管理**: 管理员账户CRUD
- **角色权限**: RBAC权限配置
- **操作日志**: 系统操作审计
- **数据备份**: 数据备份与恢复

## 权限系统

### 角色类型
1. **超级管理员 (admin)**: 拥有所有权限
2. **内容编辑 (editor)**: 行程和景点管理权限
3. **运营人员 (operator)**: 订单处理和客户服务权限

### 权限控制
- 基于RBAC（Role-Based Access Control）模型
- 支持菜单级和按钮级权限控制
- API级别的权限验证

## 安装部署

### 环境要求
- Python 3.9+
- Node.js 18+
- npm 或 yarn

### 快速启动

#### 方式一：使用启动脚本
```bash
# Windows
双击运行 start-admin.bat

# Linux/Mac
./start.sh
```

#### 方式二：手动启动

1. 启动后端服务
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2. 启动前端服务
```bash
cd frontend
npm install
npm start
```

### 访问地址
- 前端地址: http://localhost:3000
- 后端地址: http://localhost:8000
- API文档: http://localhost:8000/docs
- 管理后台: http://localhost:3000/admin

## 默认账户

### 管理员账户
- 用户名: `admin`
- 密码: `admin123`

### 用户端账户
- 用户名: `admin`
- 密码: `123456`

## API接口

### 认证接口
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/me` - 获取当前用户信息

### 仪表盘接口
- `GET /api/admin/dashboard/stats` - 获取统计数据
- `GET /api/admin/dashboard/revenue-trend` - 收入趋势
- `GET /api/admin/dashboard/user-activity` - 用户活动
- `GET /api/admin/dashboard/popular-itineraries` - 热门行程

### 用户管理接口
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/users/{id}` - 用户详情
- `PUT /api/admin/users/{id}/status` - 更新用户状态

### 行程管理接口
- `GET /api/admin/itineraries` - 行程列表
- `POST /api/admin/itineraries/{id}/review` - 审核行程
- `POST /api/admin/itineraries/{id}/publish` - 发布行程
- `POST /api/admin/itineraries/{id}/offline` - 下架行程

### 景点管理接口
- `GET /api/admin/attractions` - 景点列表
- `POST /api/admin/attractions` - 创建景点
- `PUT /api/admin/attractions/{id}` - 更新景点
- `DELETE /api/admin/attractions/{id}` - 删除景点

### 订单管理接口
- `GET /api/admin/orders` - 订单列表
- `GET /api/admin/orders/{id}` - 订单详情
- `PUT /api/admin/orders/{id}/status` - 更新订单状态
- `POST /api/admin/orders/{id}/refund` - 处理退款

### 系统管理接口
- `GET /api/admin/roles` - 角色列表
- `POST /api/admin/roles` - 创建角色
- `PUT /api/admin/roles/{id}` - 更新角色
- `DELETE /api/admin/roles/{id}` - 删除角色
- `GET /api/admin/permissions` - 权限列表
- `GET /api/admin/admin-users` - 管理员列表
- `GET /api/admin/operation-logs` - 操作日志
- `POST /api/admin/system/backup` - 创建备份

## 安全特性

1. **认证安全**
   - JWT Token认证
   - Token过期自动刷新
   - 登录失败次数限制

2. **权限控制**
   - 基于角色的访问控制
   - API级别权限验证
   - 前端路由权限控制

3. **数据安全**
   - 密码加密存储
   - SQL注入防护
   - XSS攻击防护

4. **操作审计**
   - 完整的操作日志记录
   - 操作人、时间、IP追踪
   - 敏感操作告警

## 目录结构

```
travel-planner/
├── backend/
│   ├── admin_models.py      # 管理端数据模型
│   ├── admin_schemas.py     # 管理端数据模式
│   ├── admin_routes.py      # 管理端API路由
│   ├── main.py              # 主应用入口
│   └── database.py          # 数据库配置
├── frontend/
│   └── src/
│       ├── pages/admin/
│       │   ├── AdminLayout.js      # 管理端布局
│       │   ├── AdminLogin.js       # 登录页面
│       │   ├── Dashboard.js        # 仪表盘
│       │   ├── UserManagement.js   # 用户管理
│       │   ├── ItineraryManagement.js  # 行程管理
│       │   ├── AttractionManagement.js # 景点管理
│       │   ├── OrderManagement.js  # 订单管理
│       │   ├── Analytics.js        # 数据分析
│       │   ├── RoleManagement.js   # 角色管理
│       │   ├── AdminUserManagement.js # 管理员管理
│       │   ├── OperationLogs.js    # 操作日志
│       │   └── BackupManagement.js # 备份管理
│       └── services/
│           └── adminApi.js  # 管理端API服务
└── start-admin.bat          # 启动脚本
```

## 开发说明

### 添加新功能模块

1. 在 `backend/admin_models.py` 添加数据模型
2. 在 `backend/admin_schemas.py` 添加数据模式
3. 在 `backend/admin_routes.py` 添加API路由
4. 在 `frontend/src/pages/admin/` 添加页面组件
5. 更新 `frontend/src/pages/admin/index.js` 路由配置

### 权限配置

在 `admin_models.py` 的 `init_admin_data` 函数中添加新的权限：

```python
permissions_data = [
    {'name': '新功能', 'code': 'new_feature', 'type': 'menu', 'icon': 'StarOutlined', 'path': '/admin/new-feature'},
    {'name': '新功能操作', 'code': 'new_feature:action', 'type': 'button', 'parent_code': 'new_feature'},
]
```

## 更新日志

### v1.0.0 (2024-03)
- 初始版本发布
- 实现用户管理、行程管理、景点管理、订单管理
- 实现数据分析和系统设置功能
- 完成RBAC权限控制系统
- 添加操作日志和数据备份功能

## 技术支持

如有问题，请查看API文档或联系开发团队。
