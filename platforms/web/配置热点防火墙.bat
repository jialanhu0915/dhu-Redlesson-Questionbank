@echo off
chcp 65001 >nul
title 热点防火墙配置

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 请以管理员身份运行此脚本！
    echo.
    echo 方法：右键点击此文件，选择"以管理员身份运行"
    pause
    exit /b 1
)

echo ============================================
echo   热点网络防火墙配置
echo ============================================
echo.
echo [步骤1] 删除旧规则...
C:\Windows\System32\netsh.exe advfirewall firewall delete rule name="炸红题库" >nul 2>&1
C:\Windows\System32\netsh.exe advfirewall firewall delete rule name="炸红题库-热点" >nul 2>&1
C:\Windows\System32\netsh.exe advfirewall firewall delete rule name="炸红题库-全部" >nul 2>&1
C:\Windows\System32\netsh.exe advfirewall firewall delete rule name="炸红题库-热点入站" >nul 2>&1
C:\Windows\System32\netsh.exe advfirewall firewall delete rule name="炸红题库-Python" >nul 2>&1

echo [步骤2] 添加端口规则（所有配置文件）...
C:\Windows\System32\netsh.exe advfirewall firewall add rule name="炸红题库" dir=in action=allow protocol=tcp localport=50000 profile=any enable=yes

echo [步骤3] 添加Python程序规则...
:: 允许Python程序的所有入站连接
for /f "delims=" %%i in ('where python 2^>nul') do (
    C:\Windows\System32\netsh.exe advfirewall firewall add rule name="炸红题库-Python" dir=in action=allow program="%%i" profile=any enable=yes
)

echo [步骤4] 尝试为热点接口添加特殊规则...
C:\Windows\System32\netsh.exe advfirewall firewall add rule name="炸红题库-热点" dir=in action=allow protocol=tcp localport=50000 remoteip=192.168.137.0/24 profile=any enable=yes

echo [步骤5] 配置热点网络为专用网络...
powershell -Command "Get-NetConnectionProfile | Where-Object {$_.InterfaceAlias -like '*本地连接*'} | Set-NetConnectionProfile -NetworkCategory Private" 2>nul

echo.
echo ============================================
echo   配置完成！
echo ============================================
echo.
echo 如果热点仍无法访问，请使用"防火墙开关.bat"临时关闭防火墙
echo.
pause
