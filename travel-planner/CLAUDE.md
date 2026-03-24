# 江浙沪旅游行程规划系统 - 项目指南

## 项目概况

毕业设计项目。开发环境为 Mac mini（公司），演示环境为 Windows 笔记本（个人）。
必须保证两个平台都能正常运行。

## 技术栈

- **前端**: React 18 + Ant Design 5 + react-router-dom 6
- **后端**: FastAPI + SQLAlchemy + SQLite
- **AI**: 智谱 GLM-4-flash（有本地数据回退，GLM 不可用时自动用 scenic_data.py 生成行程）
- **容器**: Docker Compose（backend:8890, frontend:3890）

## 启动方式

### 方式一：Docker（推荐，跨平台一致）

```bash
cd travel-planner
docker compose up -d
# 前端: http://localhost:3890
# 后端: http://localhost:8890
```

### 方式二：手动启动（演示备用方案）

**终端 1 - 后端：**
```bash
# Windows
cd /d 你的路径\travel-planner\backend
python -m venv venv          # 首次
venv\Scripts\activate
pip install -r requirements.txt  # 首次
python main.py

# Mac
cd travel-planner/backend
python3 -m venv venv         # 首次
source venv/bin/activate
pip install -r requirements.txt  # 首次
python main.py
```
后端启动在 http://localhost:8000

**终端 2 - 前端：**
```bash
cd travel-planner/frontend
npm install    # 首次
npm start
```
前端启动在 http://localhost:3000

> **注意**: 手动启动时前端 proxy 指向 8890（Docker），需改 `frontend/package.json` 的 proxy 为 `http://localhost:8000`。

### Windows 首次部署注意事项

1. 安装 Python 3.11+、Node.js 18+、Docker Desktop
2. 把 `.env` 文件放到 `travel-planner/` 根目录（含 GLM_API_KEY）
3. `redis` 依赖在 requirements.txt 中但非必需，Windows 下安装失败可忽略
4. SQLite 数据库文件自动创建，无需额外配置

## 关键架构决策

### AI 生成行程的回退机制
- 优先调用 GLM API（15 秒超时）
- GLM 失败时自动用 `data/scenic_data.py` 的 50 个景点数据生成行程
- 本地回退覆盖 17 个城市，按 popularity 排序选景点
- 用户无感知，体验一致

### 导航栏 "创建行程" 和 "我的行程"
- 已从 iframe 嵌入重构为原生 React 组件
- UI 复刻原型 HTML 的紫色玻璃拟态风格（CSS 隔离在 `.proto-create` / `.proto-list` 下）
- 创建行程：4 步向导（基本信息 → 目的地 → 兴趣偏好 → 预算）
- 我的行程：筛选栏 + 标签页 + grid/list 双视图

### 端口映射
| 服务 | Docker 端口 | 手动启动端口 |
|------|------------|------------|
| 后端 | 8890 | 8000 |
| 前端 | 3890 | 3000 |

## 环境变量（.env）

```
GLM_API_KEY=你的智谱AI密钥
DATABASE_URL=sqlite:///./travel_planner.db
```

## 文件结构要点

- `backend/data/scenic_data.py` — 50 个景点数据（本地回退数据源）
- `backend/glm_service.py` — GLM AI 服务（超时 25 秒，重试 1 次）
- `backend/main.py` — API 路由 + 本地回退生成器 `generate_local_itinerary()`
- `frontend/src/pages/ItineraryForm.js` — 创建行程页（4 步向导）
- `frontend/src/pages/ItineraryList.js` — 我的行程页（双视图）
- `frontend/src/styles/nav-fix.css` — 导航栏响应式样式
