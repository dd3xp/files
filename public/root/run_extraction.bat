@echo off
REM 检查是否安装了Python
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo Python is not installed or not added to PATH.
    pause
    exit /b
)

REM 执行Python程序
python file_extraction_tool.py

REM 防止窗口自动关闭
pause
