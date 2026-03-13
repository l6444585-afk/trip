# 江浙沪旅游行程规划系统 - 项目文档

## 项目概述

这是一个基于 GLM-4.7 AI 模型的智能旅游行程规划系统，为用户提供个性化的江浙沪地区旅游攻略。

## 技术栈

### 后端
- **框架**: FastAPI 0.104.1
- **数据库**: SQLAlchemy 2.0.23 + SQLite
- **AI 模型**: 智谱 AI GLM-4.7 (zhipuai 2.1.5)
- **其他**: Pydantic, Uvicorn, python-dotenv

### 前端
- **框架**: React 18.2.0
- **UI 组件**: Ant Design 5.12.0
- **路由**: React Router DOM 6.20.0
- **HTTP 客户端**: Axios 1.6.2

## 项目结构

```
travel-planner/
├── backend/                 # 后端服务
│   ├── main.py            # FastAPI 主应用
│   ├── models.py          # 数据库模型
│   ├── database.py        # 数据库配置
│   ├── glm_service.py     # GLM-4.7 服务
│   ├── schemas.py        # Pydantic 模式
│   ├── requirements.txt   # Python 依赖
│   └── .env            # 环境变量
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── App.js              # 主应用组件
│   │   ├── index.js           # 入口文件
│   │   ├── index.css          # 全局样式
│   │   ├── components/
│   │   │   └── Layout.js     # 布局组件
│   │   └── pages/
│   │       ├── Home.js             # 首页
│   │       ├── ItineraryForm.js    # 行程创建表单
│   │       ├── ItineraryDetail.js  # 行程详情
│   │       └── ItineraryList.js   # 行程列表
│   ├── public/
│   │   └── index.html       # HTML 模板
│   └── package.json       # Node 依赖
└── docs/                 # 文档
```

## 核心功能

### 1. 用户偏好输入
- 表单收集出行天数、预算、出发地、同伴类型
- 支持多选兴趣偏好（美食、人文历史、自然风光等）

### 2. 智能行程生成
- 调用 GLM-4.7 API 生成个性化行程
- 生成详细的每日安排（上午、下午、晚上）
- 包含活动内容、地点、坐标和温馨提示

### 3. 行程管理
- 保存行程到数据库
- 编辑行程信息
- 删除行程
- 导出为文本文件

### 4. 智能问答助手
- 基于行程上下文的 AI 助手
- 支持多轮对话
- 回答关于交通、天气、住宿等问题

### 5. 行程可视化
- 按天展示行程安排
- 地图视图（开发中）

## API 接口

### 基础接口
- `GET /` - API 欢迎信息
- `GET /health` - 健康检查

### 用户接口
- `POST /api/users/` - 创建用户
- `GET /api/users/{user_id}` - 获取用户信息

### 行程接口
- `POST /api/itineraries/generate` - 生成新行程
- `GET /api/itineraries/` - 获取行程列表
- `GET /api/itineraries/{id}` - 获取行程详情
- `PUT /api/itineraries/{id}` - 更新行程
- `DELETE /api/itineraries/{id}` - 删除行程

### 日程接口
- `PUT /api/schedules/{id}` - 更新日程

### 问答接口
- `POST /api/chat` - AI 智能问答

## 快速开始

### 后端启动

1. 安装依赖：
```bash
cd travel-planner/backend
pip install -r requirements.txt
```

2. 配置环境变量：
编辑 `.env` 文件，设置 GLM API 密钥：
```
GLM_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///./travel_planner.db
```

3. 启动服务器：
```bash
python main.py
```

服务器将在 `http://localhost:8000` 启动

### 前端启动

1. 安装依赖：
```bash
cd travel-planner/frontend
npm install
```

2. 启动开发服务器：
```bash
npm start
```

应用将在 `http://localhost:3000` 启动

## 使用说明

### 创建行程

1. 访问首页，点击"创建新行程"
2. 填写行程信息：
   - 行程标题
   - 出行天数
   - 预算
   - 出发地
   - 同行人员类型
   - 兴趣偏好
3. 点击"生成行程"
4. 等待 AI 生成行程（可能需要几秒钟）

### 查看行程

1. 在首页点击"我的行程"
2. 查看所有已创建的行程
3. 点击"查看详情"查看具体安排

### 编辑行程

1. 进入行程详情页
2. 点击"编辑"按钮
3. 修改行程信息
4. 保存更改

### 导出行程

1. 进入行程详情页
2. 点击"导出"按钮
3. 下载文本格式的行程文件

### AI 助手

1. 进入行程详情页
2. 点击"AI 助手"按钮
3. 输入问题，例如：
   - "这个行程的交通费用大概是多少？"
   - "有什么推荐的住宿？"
   - "天气情况如何？"

## 数据库设计

### Users 表
- id: 主键
- username: 用户名
- email: 邮箱
- created_at: 创建时间

### Itineraries 表
- id: 主键
- user_id: 用户 ID（外键）
- title: 行程标题
- days: 天数
- budget: 预算
- departure: 出发地
- companion_type: 同行人员类型
- interests: 兴趣偏好（逗号分隔）
- created_at: 创建时间
- updated_at: 更新时间

### Schedules 表
- id: 主键
- itinerary_id: 行程 ID（外键）
- day: 第几天
- period: 时段（morning/afternoon/evening）
- activity: 活动内容
- location: 地点
- latitude: 纬度
- longitude: 经度
- notes: 备注

### Attractions 表
- id: 主键
- name: 景点名称
- city: 城市
- category: 类别
- description: 描述
- latitude: 纬度
- longitude: 经度
- rating: 评分
- recommended_duration: 推荐游玩时长
- best_time_to_visit: 最佳游览时间
- ticket_price: 门票价格

## GLM-4.7 集成

### Prompt 设计

系统使用精心设计的 Prompt 来确保 GLM-4.7 输出结构化的 JSON 格式：

```python
prompt = f"""请为我规划一个{days}天的江浙沪旅游行程，具体要求如下：

出发地：{departure}
预算：{budget}元
同行人员：{companion_type}
兴趣偏好：{', '.join(interests)}

请按照以下JSON格式输出行程规划：
{{
  "itinerary": {{
    "title": "行程标题",
    "summary": "行程概述",
    "daily_plans": [...]
  }}
}}
"""
```

### API 调用

```python
response = self.client.chat.completions.create(
    model="glm-4",
    messages=[
        {
            "role": "system",
            "content": "你是一位专业的旅游规划师..."
        },
        {
            "role": "user",
            "content": prompt
        }
    ],
    temperature=0.7,
    max_tokens=2000
)
```

## 待完成功能

- [ ] 高德地图 API 集成
- [ ] PDF 导出功能
- [ ] 用户认证系统
- [ ] 行程分享功能
- [ ] 天气 API 集成
- [ ] 酒店预订集成
- [ ] 门票预订集成

## 注意事项

1. **API 密钥**: 确保在 `.env` 文件中正确配置 GLM API 密钥
2. **数据库**: 首次运行会自动创建 SQLite 数据库
3. **CORS**: 后端已配置 CORS，允许跨域请求
4. **错误处理**: 前端已实现基本的错误提示
5. **性能**: GLM-4.7 API 调用可能需要几秒钟，请耐心等待

## 故障排除

### 后端启动失败
- 检查 Python 版本（建议 3.8+）
- 确保所有依赖已安装：`pip install -r requirements.txt`
- 检查端口 8000 是否被占用

### 前端启动失败
- 检查 Node.js 版本（建议 16+）
- 确保所有依赖已安装：`npm install`
- 检查端口 3000 是否被占用

### GLM API 调用失败
- 检查 API 密钥是否正确
- 检查网络连接
- 查看 API 配额是否用完

## 许可证

MIT License

## 联系方式

如有问题，请通过以下方式联系：
- 提交 Issue
- 发送邮件

---

**开发完成日期**: 2026-01-22
**版本**: 1.0.0
**开发者**: Claude Code + GLM-4.7
