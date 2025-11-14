# How to Start MongoDB on Windows

## Quick Start

### Option 1: Using Windows Services (Easiest)

1. **Press `Win + R`** (Windows key + R)
2. Type `services.msc` and press Enter
3. Find **"MongoDB"** in the list (or "MongoDB Server")
4. **Right-click** on it → **"Start"**
5. Wait a few seconds for it to start
6. The status should change to "Running"

### Option 2: Using Command Line

1. Open **PowerShell** or **Command Prompt** as Administrator
2. Run:
   ```powershell
   net start MongoDB
   ```

### Option 3: Manual Start (If MongoDB is installed manually)

1. Open **PowerShell** or **Command Prompt**
2. Create data directory (if it doesn't exist):
   ```powershell
   mkdir C:\data\db
   ```
3. Start MongoDB:
   ```powershell
   mongod --dbpath "C:\data\db"
   ```
4. Keep this window open (MongoDB runs in foreground)

## Verify MongoDB is Running

Open a **new** terminal window and run:
```powershell
mongosh
```

If you see:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000
Using MongoDB: ...
Using Mongosh: ...
```

Then MongoDB is running! Type `exit` to quit.

## If MongoDB is Not Installed

1. Download MongoDB Community Server:
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI installer
   - Download and install

2. During installation:
   - Choose "Complete" installation
   - Check "Install MongoDB as a Service"
   - Service name: "MongoDB"
   - Run service as: "Network Service user"

3. After installation, MongoDB should start automatically

## Troubleshooting

### "MongoDB service not found"
- MongoDB is not installed or not installed as a service
- Install MongoDB using the installer (see above)

### "Access Denied" when starting service
- Run PowerShell/Command Prompt as Administrator
- Right-click → "Run as administrator"

### Port 27017 already in use
- Another MongoDB instance might be running
- Check: `netstat -ano | findstr :27017`
- Stop the other instance or use a different port

### Can't connect after starting
- Wait 10-15 seconds for MongoDB to fully start
- Check Windows Event Viewer for MongoDB errors
- Try restarting the MongoDB service

## Next Steps

Once MongoDB is running:
1. Go back to your backend terminal
2. The server should automatically connect
3. You should see: `✓ Connected to MongoDB`
4. Try login/signup in your frontend app

