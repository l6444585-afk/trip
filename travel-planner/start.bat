@echo off
chcp 65001 >nul
echo ========================================
echo   江浙沪旅游行程规划系统 - 启动脚本
echo ========================================
echo.

echo [1/3] 检查环境变量配置...
if not exist ".env" (
    echo 未找到 .env 文件，正在从 .env.example 创建...
    copy .env.example .env >nul
    echo 已创建 .env 文件，请编辑该文件并填入您的 API 密钥
    echo.
    echo 按任意键打开 .env 文件进行配置...
    pause >nul
    notepad .env
    echo.
    echo 配置完成后，请重新运行此脚本
    pause
    exit /b 1
)

echo [2/3] 检查 Docker 环境...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到 Docker，请先安装 Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM 优先用 docker compose v2，不行再用 docker-compose v1
set COMPOSE_CMD=
docker compose version >nul 2>&1
if %errorlevel% equ 0 (
    set COMPOSE_CMD=docker compose
) else (
    docker-compose --version >nul 2>&1
    if %errorlevel% equ 0 (
        set COMPOSE_CMD=docker-compose
    )
)

if "%COMPOSE_CMD%"=="" (
    echo 错误: 未检测到 Docker Compose，请升级 Docker Desktop
    pause
    exit /b 1
)

echo 使用: %COMPOSE_CMD%
echo.

echo [3/3] 启动服务...
echo.
echo 正在构建并启动容器...
%COMPOSE_CMD% up -d --build

if %errorlevel% neq 0 (
    echo.
    echo 启动失败，请检查错误信息
    pause
    exit /b 1
)

echo.
echo ========================================
echo   服务启动成功！
echo ========================================
echo.
echo 前端地址: http://localhost:3890
echo 后端地址: http://localhost:8890
echo API 文档: http://localhost:8890/docs
echo.
echo 默认账号: admin / 123456
echo.
echo 按任意键查看日志...
pause >nul
%COMPOSE_CMD% logs -f
