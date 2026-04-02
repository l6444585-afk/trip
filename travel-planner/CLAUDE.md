# 江浙沪旅游行程规划系统 - 项目指南

## 项目概况

毕业设计项目。开发环境为 Mac mini（公司），演示环境为 Windows 笔记本（个人）。
必须保证两个平台都能正常运行。

### 响应式要求
所有页面必须适配：桌面（Mac/Windows 笔记本）、平板、手机（安卓/iOS）、小程序尺寸。
- 断点：桌面(>1024px)、平板(768-1024px)、手机(<768px)
- 按钮最小 44px 点击区域，触控友好
- 横向滚动替代换行，避免内容挤压

## 技术栈

- **前端**: React 18 + Ant Design 5 + react-router-dom 6
- **后端**: FastAPI + SQLAlchemy + SQLite
- **AI**: 智谱 GLM-4-flash（有本地数据回退，GLM 不可用时自动用 scenic_data.py 生成行程）
- **容器**: OrbStack + Docker Compose（backend:8890, frontend:3890）

## 启动方式

### 方式一：OrbStack 容器（推荐，跨平台一致）

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

> **注意**: 前端通过 `src/setupProxy.js` 自动代理 API 请求。手动启动默认指向 `localhost:8000`，Docker 模式通过环境变量 `REACT_APP_BACKEND_URL=http://backend:8000` 指向容器内后端，无需手动切换。

### Windows 首次部署注意事项

1. 安装 Python 3.11+、Node.js 18+、OrbStack（或 Docker Desktop）
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
| 服务 | 容器端口 | 手动启动端口 |
|------|------------|------------|
| 后端 | 8890 | 8000 |
| 前端 | 3890 | 3000 |

### 元认知自审（每次完成任务后 MUST 执行，不等用户催）
1. **找 bug** — 模拟用户实际操作路径，不要只跑 build。本地能跑不代表线上/Docker/Windows 也能跑，MUST 逐一验证
2. **提建议** — 主动指出用户做得不好的地方和可以改进的地方，用户愿意听
3. **反思弯路** — 回顾哪些步骤多余、哪些决策错误，告诉用户。API 调用不准确、配置遗漏这类问题要在第一时间发现
4. **不隐瞒** — 发现问题第一时间说，不等用户发现。有 bug 自己改，不要等用户发现才改
5. **自动修复** — 发现 bug 直接修，不要只报告不修。修完验证，没问题就推送

### 用户体验思维（产品 taste，永久执行）
1. **新用户视角** — 一个人第一次进系统，从哪里开始？顺不顺手？操作逻辑跟用户预期是否一致？
2. **流程走查** — 每次改完功能，MUST 从首页开始走一遍完整用户路径，不能只测改动的那个页面
3. **跨平台验证** — Mac 能跑不够，MUST 确保 Windows、Docker、手机端体验一致
4. **培养 taste** — 如果将来要做产品，一开始就要培养对用户体验的品味。不只是"能用"，要"好用"

### 论文图表生成（永久生效）
- 工具：next-ai-draw-io (https://next-ai-drawio.jiang.jp/zh) + 豆包 Doubao-Seed-2.0-pro
- 图表描述文件：`论文图表/*.md`，可直接上传到工具的"文档转图表"功能
- 也可上传参考论文截图，用"复制流程图"复刻风格再改内容
- **风格铁律：纯黑白，零颜色，标准UML/Chen记法，学术论文风格**
- 导出 PNG（300dpi）插入 Word

### Git 推送规则（永久生效）
- 每次推送 MUST 同时推 `main` 和 `develop` 两个分支
- 推送前检查两分支是否同步，有差异先合并
- 命令：`git push origin main && git push origin develop`

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
