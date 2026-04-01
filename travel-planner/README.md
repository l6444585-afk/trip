# 江浙沪旅游行程规划系统

## 项目简介
基于 GLM-4.7 AI 模型的智能旅游行程规划系统，为用户提供个性化的江浙沪地区旅游攻略。系统采用现代化界面设计，支持一键部署，可在任意电脑上快速启动。

## 技术栈
- **前端**: React.js + Ant Design
- **后端**: Python FastAPI + Uvicorn
- **AI 模型**: 智谱 AI GLM-4.7
- **数据库**: SQLite
- **地图服务**: 高德地图 API
- **容器化**: Docker + Docker Compose

## 核心功能
1. **智能行程生成** - 基于用户偏好（天数、预算、出发地、同伴类型、兴趣偏好）生成个性化行程
2. **地图可视化** - 在地图上直观展示行程路线和景点位置
3. **行程管理** - 支持保存、编辑、删除、导出 PDF 等多种格式
4. **智能问答助手** - 基于行程上下文的 AI 助手，随时解答疑问
5. **现代化界面** - 清新人文气质的设计风格，流畅的交互体验

## 项目结构
```
travel-planner/
├── backend/          # FastAPI 后端
│   ├── main.py      # 主应用入口
│   ├── database.py  # 数据库配置
│   ├── models.py    # 数据模型
│   ├── schemas.py   # Pydantic 模型
│   ├── glm_service.py # GLM-4.7 服务
│   ├── auth_utils.py # 认证工具
│   ├── Dockerfile   # 后端容器配置
│   └── requirements.txt
├── frontend/         # React 前端
│   ├── src/
│   │   ├── components/ # 组件
│   │   ├── pages/      # 页面
│   │   ├── App.js      # 主应用
│   │   └── index.css   # 全局样式
│   ├── Dockerfile   # 前端容器配置
│   └── package.json
├── docker-compose.yml # 容器编排配置
├── .env.example     # 环境变量模板
└── README.md
```

## 快速开始

### 方式一：Docker 一键部署（推荐）

#### 前置要求
- 安装 Docker Desktop
- 安装 Docker Compose

#### 部署步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd travel-planner
```

2. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的 API 密钥：
```env
GLM_API_KEY=your_glm_api_key_here
SECRET_KEY=your-secret-key-change-in-production
REACT_APP_AMAP_KEY=your_amap_api_key_here
```

3. **一键启动**
```bash
docker-compose up -d
```

4. **访问应用**
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

5. **停止服务**
```bash
docker-compose down
```

6. **查看日志**
```bash
docker-compose logs -f
```

### 方式二：本地开发模式

#### Windows 启动方式

**第一步：启动后端服务**

打开命令行窗口（CMD 或 PowerShell），执行：
```cmd
cd /d D:\Trae\trip\travel-planner\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

> 注：`python -m venv venv` 和 `pip install` 只需首次执行一次，之后启动只需：
> ```cmd
> cd /d D:\Trae\trip\travel-planner\backend
> venv\Scripts\activate
> python main.py
> ```

**第二步：启动前端服务**

打开**另一个**命令行窗口，执行：

首次安装依赖（CMD）：
```cmd
cd /d D:\Trae\trip\travel-planner\frontend
npm install
npm start
```

首次安装依赖（PowerShell）：
```powershell
cd D:\Trae\trip\travel-planner\frontend
npm install
npm start
```

> 如果 `npm install` 报错，先清理 node_modules 再重装：
> - **CMD**：`rd /s /q node_modules` 然后 `npm install`
> - **PowerShell**：`Remove-Item -Recurse -Force node_modules` 然后 `npm install`

之后每次启动只需：
```cmd
cd /d D:\Trae\trip\travel-planner\frontend
npm start
```

#### Mac 启动方式

**终端 1 - 后端：**
```bash
cd ~/Projects/trip/travel-planner/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

**终端 2 - 前端：**
```bash
cd ~/Projects/trip/travel-planner/frontend
npm install
npm start
```

#### 访问应用
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

#### Windows 首次部署注意事项
1. 需安装 Python 3.11+、Node.js 18+
2. 把 `.env` 文件放到 `travel-planner/` 根目录（含 API 密钥）
3. Redis 连接失败是正常的，系统会自动切换内存缓存，功能不受影响
4. SQLite 数据库文件自动创建，无需额外配置
5. venv 虚拟环境不能跨平台复制，Windows 和 Mac 需各自创建
6. `npm install` 报错时，先清理 node_modules 再重装：
   - **CMD**：`rd /s /q node_modules` 然后 `npm install`
   - **PowerShell**：`Remove-Item -Recurse -Force node_modules` 然后 `npm install`

## API 配置说明

### GLM-4.7 API 密钥
1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册账号并创建 API Key
3. 将 API Key 填入 `.env` 文件的 `GLM_API_KEY` 变量

### 高德地图 API 密钥
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册账号并创建 Web 端 (JS API) 应用
3. 将 Key 填入 `.env` 文件的 `REACT_APP_AMAP_KEY` 变量

## 默认账号
系统会自动创建演示账号：
- 用户名: `admin`
- 密码: `123456`

## 常见问题

### Docker 相关

**Q: Docker 容器启动失败？**
A: 检查端口是否被占用，确保 3000 和 8000 端口未被其他程序使用。

**Q: 如何查看容器日志？**
A: 使用 `docker-compose logs -f` 查看实时日志。

**Q: 如何重新构建镜像？**
A: 使用 `docker-compose build --no-cache` 强制重新构建。

### 开发相关

**Q: 前端无法连接后端？**
A: 检查后端服务是否正常运行，确认 `package.json` 中的 `proxy` 配置正确。

**Q: 行程生成失败？**
A: 检查 GLM API Key 是否正确，确认网络连接正常。

**Q: 地图无法显示？**
A: 检查高德地图 API Key 是否正确配置。

## 项目特色

### 界面设计
- 采用清新自然的配色方案，符合江浙沪旅游的人文气质
- 现代化卡片式布局，层次分明
- 流畅的动画效果和交互反馈
- 响应式设计，支持多设备访问

### 技术亮点
- 前后端分离架构
- RESTful API 设计
- Docker 容器化部署
- 健康检查机制
- 自动数据持久化

## 开发计划

- [ ] 支持用户注册和登录
- [ ] 添加行程分享功能
- [ ] 支持多人协作编辑
- [ ] 添加行程评论和评分
- [ ] 集成更多 AI 功能（图片识别、语音交互等）

## 许可证
MIT License

## 核心资产保护

本项目包含受保护的核心资产，未经授权不得修改、删除或破坏性重构。详细信息请查看 [核心资产保护文档](./CORE_ASSETS_PROTECTION.md)。

### 受保护的核心模块
- **地图可视化模块** (MapVisualization.js) - 高德地图集成
- **认证模块** (auth_utils.py) - JWT 认证
- **数据库模块** (database.py) - 数据库连接管理
- **AI 服务模块** (glm_service.py) - GLM-4.7 集成
- **主应用入口** (main.py) - FastAPI 应用配置

### 代码保护标识
所有受保护的核心资产都包含以下保护声明：

```javascript
/**
 * ============================================
 * 代码保护声明 | Code Protection Notice
 * ============================================
 * 本组件为受保护的核心资产，未经授权不得修改、复制或分发。
 * This component is a protected core asset. Unauthorized modification,
 * copying, or distribution is prohibited.
 * 
 * 版权所有 © 2024 Trae AI
 * Copyright © 2024 Trae AI. All rights reserved.
 * ============================================
 */
```

## 联系方式
如有问题或建议，欢迎提交 Issue 或 Pull Request。
