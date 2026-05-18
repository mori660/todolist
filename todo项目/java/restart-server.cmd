@echo off
chcp 65001 >nul
echo ========================================
echo   TODO管理系统 - 服务重启脚本
echo ========================================

echo.
echo [1/3] 正在停止现有服务...
echo.

REM 查找并停止占用8080端口的Java进程
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo 发现端口8080被占用，进程ID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo 已停止进程 %%a
    )
)

REM 等待进程完全停止
timeout /t 2 /nobreak >nul

echo.
echo [2/3] 编译项目...
echo.

cd /d "%~dp0"
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo 错误: 项目编译失败
    pause
    exit /b 1
)

echo.
echo [3/3] 启动服务...
echo.
echo 服务启动中，请稍候...
echo 访问地址: http://localhost:8080
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

call mvn cargo:run
