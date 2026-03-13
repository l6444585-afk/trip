#!/bin/bash

echo "========================================"
echo "  江浙沪旅游行程规划系统 - 启动脚本"
echo "========================================"
echo

echo "[1/3] 检查环境变量配置..."
if [ ! -f ".env" ]; then
    echo "未找到 .env 文件，正在从 .env.example 创建..."
    cp .env.example .env
    echo "已创建 .env 文件，请编辑该文件并填入您的 API 密钥"
    echo
    read -p "按回车键打开 .env 文件进行配置..."
    ${EDITOR:-nano} .env
    echo
    echo "配置完成后，请重新运行此脚本"
    exit 1
fi

echo "[2/3] 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    echo "错误: 未检测到 Docker，请先安装 Docker"
    echo "下载地址: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: 未检测到 Docker Compose，请先安装"
    exit 1
fi

echo "[3/3] 启动服务..."
echo
echo "正在构建并启动容器..."
docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo
    echo "启动失败，请检查错误信息"
    exit 1
fi

echo
echo "========================================"
echo "  服务启动成功！"
echo "========================================"
echo
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:8000"
echo "API 文档: http://localhost:8000/docs"
echo
echo "默认账号: admin / 123456"
echo
echo "按 Ctrl+C 停止查看日志"
docker-compose logs -f