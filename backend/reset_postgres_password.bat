@echo off
echo This script will help you reset your PostgreSQL password

REM Check if psql is in PATH
where psql > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo PostgreSQL command line tools not found in PATH
    echo Please add PostgreSQL bin directory to your PATH
    echo Default location is: C:\Program Files\PostgreSQL\{version}\bin
    pause
    exit /b 1
)

echo Connecting to PostgreSQL to reset password...
echo.
echo Enter the following commands when psql opens:
echo \password postgres
echo Then enter your new password (use: admin)
echo \q
echo.
pause
psql -U postgres -d postgres

echo.
echo If you successfully changed the password, update settings.py with the new password
pause 