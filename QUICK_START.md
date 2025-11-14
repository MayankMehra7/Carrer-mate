# Quick Start Guide - Fix Login/Signup

## The Problem
Your backend server is not running, which is why you're seeing:
- `ERR_CONNECTION_REFUSED` errors
- `500 (INTERNAL SERVER ERROR)` when the server was running but had MongoDB issues

## Solution: Start the Backend Server

### Step 1: Start MongoDB

**Windows:**
1. Press `Win + R`, type `services.msc`, press Enter
2. Find "MongoDB" in the list
3. Right-click → "Start"

**OR** if MongoDB is installed manually:
```bash
mongod --dbpath "C:\data\db"
```

**Check if MongoDB is running:**
```bash
# Open a new terminal and run:
mongosh
# If it connects, MongoDB is running. Type 'exit' to quit.
```

### Step 2: Install Backend Dependencies

```bash
cd career_mate_backend
pip install -r requirements.txt
```

### Step 3: Start the Backend Server

**Option A: Use the batch script (Windows)**
```bash
cd career_mate_backend
start_backend.bat
```

**Option B: Manual start**
```bash
cd career_mate_backend
python run.py
```

You should see:
```
✓ Connected to MongoDB: mongodb://localhost:27017/career_mate_ai
 * Running on http://0.0.0.0:5000
```

### Step 4: Test the Backend

Open your browser and go to: `http://localhost:5000/api/oauth/status`

You should see a JSON response (not an error).

### Step 5: Try Login/Signup Again

Now go back to your frontend app and try:
1. **Signup** - Create a new account
2. **Login** - Sign in with your credentials

## Troubleshooting

### "ModuleNotFoundError: No module named 'pymongo'"
**Solution:** Run `pip install -r requirements.txt` in the `career_mate_backend` folder

### "Failed to connect to MongoDB"
**Solution:** 
1. Make sure MongoDB is running (see Step 1)
2. Check your `.env` file has: `MONGO_URI=mongodb://localhost:27017/career_mate_ai`

### "Port 5000 already in use"
**Solution:** 
1. Find what's using port 5000: `netstat -ano | findstr :5000`
2. Kill that process or change PORT in `.env` file

### Backend starts but still getting 500 errors
**Solution:** Check the backend console output for specific error messages. Common issues:
- MongoDB not running
- Missing environment variables in `.env`
- Database connection issues

## Fixed Issues

✅ **AccountConflictDialog error** - Fixed React hooks usage
✅ **MongoDB connection** - Added error handling and connection testing
✅ **Database object mismatch** - Fixed `models.py` to use correct database object

## Next Steps

Once the backend is running:
1. Frontend should automatically connect to `http://localhost:5000`
2. Try signing up with a new account
3. Check your email for OTP (if email is configured)
4. Complete signup and login

---

**Note:** The frontend errors about `AccountConflictDialog` should now be resolved. The main issue is getting the backend server running.

