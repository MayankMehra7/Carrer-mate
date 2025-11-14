# Backend Setup Instructions

## Issues Fixed
1. ✅ Fixed MongoDB connection configuration in `config.py`
2. ✅ Fixed `models.py` to use database object correctly (changed `mongo.db.users` to `mongo.users`)
3. ✅ Added error handling for MongoDB connection
4. ✅ Added logger import to `models.py`

## Setup Steps

### 1. Install Python Dependencies
```bash
cd career_mate_backend
pip install -r requirements.txt
```

### 2. Start MongoDB
**Windows:**
- Check if MongoDB is installed: Look for MongoDB in Services
- If not installed, download from: https://www.mongodb.com/try/download/community
- Start MongoDB service:
  ```powershell
  # Option 1: Start via Services (Windows Key + R, type "services.msc", find MongoDB)
  # Option 2: If installed manually, run:
  mongod --dbpath "C:\data\db"
  ```

**Linux/Mac:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 3. Verify MongoDB Connection
```bash
cd career_mate_backend
python test_mongo_connection.py
```

### 4. Start Backend Server
```bash
cd career_mate_backend
python run.py
```

The server should start on `http://localhost:5000`

## Troubleshooting

### MongoDB Connection Failed
- **Error**: "Failed to connect to MongoDB"
- **Solution**: 
  1. Make sure MongoDB is running
  2. Check `.env` file has correct `MONGO_URI`
  3. Default: `mongodb://localhost:27017/career_mate_ai`

### Module Not Found Errors
- **Error**: "ModuleNotFoundError: No module named 'pymongo'"
- **Solution**: Run `pip install -r requirements.txt`

### 500 Internal Server Error
- Check backend console for error messages
- Verify MongoDB is running and accessible
- Check `.env` file configuration

## Testing Login/Signup

After starting the backend:
1. Frontend should connect to `http://localhost:5000`
2. Try signing up with a new account
3. Check email for OTP (if email is configured)
4. Verify OTP to complete signup
5. Login with credentials

## Environment Variables (.env)

Make sure your `.env` file has:
```
MONGO_URI=mongodb://localhost:27017/career_mate_ai
FLASK_SECRET=your_secret_key_here
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
GEMINI_API_KEY=your_gemini_key
```

