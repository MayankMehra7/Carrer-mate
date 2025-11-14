@echo off
echo Starting Career Mate Backend Server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found
    echo Please create .env file with MONGO_URI and other required variables
    echo.
)

REM Check MongoDB connection
echo Checking MongoDB connection...
python -c "from pymongo import MongoClient; import os; from dotenv import load_dotenv; load_dotenv(); client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017/'), serverSelectionTimeoutMS=2000); client.server_info(); print('MongoDB connection OK')" 2>nul
if errorlevel 1 (
    echo.
    echo ERROR: Cannot connect to MongoDB
    echo Please make sure MongoDB is running
    echo.
    echo To start MongoDB on Windows:
    echo   1. Open Services (Win+R, type services.msc)
    echo   2. Find "MongoDB" service
    echo   3. Right-click and select "Start"
    echo.
    echo Or run manually:
    echo   mongod --dbpath "C:\data\db"
    echo.
    pause
    exit /b 1
)

echo.
echo Starting Flask server...
echo Backend will be available at http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

python run.py

pause

