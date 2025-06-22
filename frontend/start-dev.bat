@echo off
echo ===============================================
echo HighPay React Dashboard Development Setup
echo ===============================================
echo.

echo Checking if backend is running...
curl -s http://localhost:3000/health > nul
if %errorlevel% neq 0 (
    echo WARNING: Backend API is not running on port 3000
    echo Please start the backend server first:
    echo   cd .. ^&^& npm start
    echo.
)

echo Installing dependencies...
call npm install

echo.
echo Starting development server...
echo Dashboard will be available at: http://localhost:3001
echo.
echo Demo Credentials:
echo - Admin: admin@company.com / admin123
echo - Manager: manager@company.com / manager123  
echo - Employee: employee@company.com / employee123
echo.

call npm run dev

pause
