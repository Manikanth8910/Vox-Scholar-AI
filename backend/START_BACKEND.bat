@echo off
echo ========================================
echo VoxScholar Backend Startup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)
echo.

echo [2/3] Installing dependencies...
python -m pip install fastapi uvicorn sqlalchemy aiosqlite pydantic pydantic-settings python-jose passlib bcrypt openai groq elevenlabs pymupdf python-dotenv aiofiles python-multipart email-validator --quiet
echo.

echo [3/3] Starting server...
echo.
echo Backend will start on: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
