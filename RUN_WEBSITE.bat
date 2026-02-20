@echo off
echo ========================================
echo Starting VoxScholar AI
echo ========================================
echo.

REM Start Backend
echo [1/2] Starting Backend Server...
cd backend
start cmd /k "title Backend Server && python -m venv venv 2>nul && call venv\Scripts\activate && pip install -r requirements.txt --quiet && uvicorn app.main:app --reload --port 8000"
cd ..

timeout /t 5 /nobreak >nul

REM Start Frontend
echo [2/2] Starting Frontend...
cd frontend
start cmd /k "title Frontend Server && npm install && npm run dev"
cd ..

echo.
echo ========================================
echo VoxScholar AI is starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:8080
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:8080

echo.
echo Close the terminal windows to stop the servers.
