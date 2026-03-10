@echo off
chcp 65001 >nul
echo ========================================
echo   江浙沪旅游行程规划系统 - 管理端启动
echo ========================================
echo.

echo [1/4] 检查 Python 环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到 Python，请先安装 Python 3.9+
    pause
    exit /b 1
)

echo [2/4] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo [3/4] 安装后端依赖...
cd backend
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt -q

echo [4/4] 安装前端依赖...
cd ..\frontend
call npm install --silent

echo.
echo ========================================
echo   启动服务中...
echo ========================================
echo.

start "Backend Server" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 >nul
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   服务启动成功！
echo ========================================
echo.
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:8000
echo API 文档: http://localhost:8000/docs
echo 管理后台: http://localhost:3000/admin
echo.
echo 用户端账号: admin / 123456
echo 管理端账号: admin / admin123
echo.
echo 按任意键退出...
pause >nul
