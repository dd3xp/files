@echo off
REM 切换到当前目录
cd /d %~dp0

REM 启动 Rails 服务器
rails server
