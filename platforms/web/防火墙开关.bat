@echo off
chcp 65001 >nul
title 防火墙开关

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 请以管理员身份运行此脚本！
    echo.
    echo 方法：右键点击此文件，选择"以管理员身份运行"
    pause
    exit /b 1
)

:menu
cls
echo ============================================
echo   防火墙快捷开关
echo ============================================
echo.
echo   1. 关闭防火墙（允许热点访问）
echo   2. 开启防火墙（恢复保护）
echo   3. 查看防火墙状态
echo   4. 退出
echo.
set /p choice=请选择 (1-4): 

if "%choice%"=="1" goto off
if "%choice%"=="2" goto on
if "%choice%"=="3" goto status
if "%choice%"=="4" exit /b 0
goto menu

:off
echo.
echo [操作] 正在关闭防火墙...
C:\Windows\System32\netsh.exe advfirewall set allprofiles state off
echo.
echo [完成] 防火墙已关闭，手机可以通过热点访问了
echo        热点访问地址: http://192.168.137.1:50000
echo.
echo [提醒] 使用完毕后请记得重新开启防火墙！
pause
goto menu

:on
echo.
echo [操作] 正在开启防火墙...
C:\Windows\System32\netsh.exe advfirewall set allprofiles state on
echo.
echo [完成] 防火墙已开启，系统已恢复保护
pause
goto menu

:status
echo.
echo [状态] 当前防火墙状态：
echo.
C:\Windows\System32\netsh.exe advfirewall show allprofiles state
pause
goto menu
