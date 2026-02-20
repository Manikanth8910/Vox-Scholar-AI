@echo off
REM Quick Start Script for VoxScholar AI Podcast Generation
REM Windows version

echo ========================================
echo VoxScholar AI - Podcast Generation
echo Quick Start Script
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate
echo.

REM Install/update dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet
echo.

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please copy .env.example to .env and add your API keys:
    echo   - OPENAI_API_KEY
    echo   - ELEVENLABS_API_KEY
    echo.
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo Please edit .env file and add your API keys, then run this script again.
    pause
    exit /b
)

REM Check for API keys
findstr /C:"OPENAI_API_KEY=sk-" .env >nul
if errorlevel 1 (
    echo WARNING: OPENAI_API_KEY not configured in .env
    echo Please add your OpenAI API key to .env file
    echo.
)

findstr /C:"ELEVENLABS_API_KEY=" .env | findstr /V /C:"ELEVENLABS_API_KEY=$" >nul
if errorlevel 1 (
    echo WARNING: ELEVENLABS_API_KEY not configured in .env
    echo Please add your ElevenLabs API key to .env file
    echo.
)

echo ========================================
echo Starting FastAPI Server...
echo ========================================
echo.
echo API will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
uvicorn app.main:app --reload --port 8000
