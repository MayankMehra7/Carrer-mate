# Career Mate AI - Complete Setup Guide

Welcome! This guide will walk you through setting up the Career Mate AI application from scratch. Follow each step carefully to get both the frontend and backend running.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start Summary](#quick-start-summary)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [MongoDB Configuration](#mongodb-configuration)
- [Email Configuration](#email-configuration)
- [AI Features Configuration](#ai-features-configuration)
- [OAuth Setup (Optional)](#oauth-setup-optional)
- [Testing the App](#testing-the-app)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have these installed:

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
  - Verify: Run `node --version` in terminal
- **Python 3.10+** - [Download here](https://www.python.org/downloads/)
  - Verify: Run `python --version` or `python3 --version`
- **MongoDB** - Choose one:
  - Local: [Download MongoDB Community](https://www.mongodb.com/try/download/community)
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Recommended - Free tier available)
- **npm** or **yarn** - Comes with Node.js
  - Verify: Run `npm --version`

### Optional but Recommended
- **Git** - For cloning and version control
- **Expo Go app** - For testing on physical devices ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **Android Studio** or **Xcode** - For emulators (optional)

---

## Quick Start Summary

**TL;DR - What you need to do:**

1. Install dependencies (backend + frontend)
2. Create `.env` files in both directories
3. Add your credentials to the `.env` files:
   - MongoDB connection string
   - Gmail app password
   - Gemini API key
4. Start backend: `cd career_mate_backend && python run.py`
5. Start frontend: `npx expo start --clear`
6. Open app on device/emulator

**Minimum time:** ~15-30 minutes (if you already have accounts set up)

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd career_mate_backend
```

### Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
```

Or if you're using Python 3 specifically:
```bash
pip3 install -r requirements.txt
```

### Step 3: Create Backend Environment File

Copy the example file:
```bash
cp .env.example .env
```

Or create `.env` manually in the `career_mate_backend` folder.

### Step 4: Configure Backend Environment Variables

Open `career_mate_backend/.env` and fill in the required values:

#### Required Variables:

```bash
# Flask Secret - Change this to any random string
FLASK_SECRET=your_random_secret_key_here_12345678

# MongoDB Connection - See MongoDB Configuration section below
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/?appName=Cluster0

# Gemini AI Key - See AI Features Configuration section below
GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration - See Email Configuration section below
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_16_char_gmail_app_password
```

**Don't have these credentials yet?** See the configuration sections below for detailed instructions.

### Step 5: Start the Backend Server

```bash
python run.py
```

Or:
```bash
python3 run.py
```

**Expected output:**
```
 * Running on http://0.0.0.0:5000
 * Running on http://192.168.x.x:5000
```

If you see these messages, your backend is running successfully! ✅

**Keep this terminal open** - the backend needs to stay running.

---

## Frontend Setup

Open a **new terminal window** for the frontend.

### Step 1: Navigate to Project Root

```bash
cd /path/to/Carrer-mate
```

(The root directory, NOT the career_mate_backend folder)

### Step 2: Install Frontend Dependencies

```bash
npm install
```

This may take a few minutes.

### Step 3: Create Frontend Environment File

Copy the example file:
```bash
cp .env.example .env
```

Or create `.env` manually in the project root.

### Step 4: Configure Frontend Environment Variables

Open `.env` (in the project root) and update the API URL:

#### Find Your Local IP Address:

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" - usually something like `192.168.1.100`

**Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Linux:**
```bash
hostname -I
```

#### Update the API URL:

```bash
# Replace YOUR_LOCAL_IP with the IP address you found
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
```

**Examples:**
- Physical device: `EXPO_PUBLIC_API_URL=http://192.168.1.100:5000`
- Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000`
- iOS simulator: `EXPO_PUBLIC_API_URL=http://localhost:5000`

### Step 5: Start the Expo Development Server

```bash
npx expo start --clear
```

The `--clear` flag clears the cache (recommended for first run).

**Expected output:**
- A QR code appears in the terminal
- Expo DevTools URL: `http://localhost:8081`

### Step 6: Open the App

**Option A: Physical Device (Recommended)**
1. Install Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Scan the QR code from the terminal
3. App should load on your device

**Option B: Emulator**
- Press `a` in the terminal to open Android emulator
- Press `i` in the terminal to open iOS simulator (Mac only)

If the login screen loads, congratulations! Your frontend is working! ✅

---

## MongoDB Configuration

You need a MongoDB database for the app to store user data. Choose one option:

### Option 1: MongoDB Atlas (Recommended - Easiest)

**Free tier available** - No credit card required.

1. **Sign up:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Click "Start Free" and create an account

2. **Create a cluster:**
   - After signup, click "Create Cluster"
   - Choose the **FREE tier** (M0)
   - Select a cloud provider and region close to you
   - Click "Create Cluster" (takes 3-5 minutes)

3. **Create a database user:**
   - Click "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter a username and password (remember these!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Whitelist your IP address:**
   - Click "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (or add your specific IP)
   - Click "Confirm"

5. **Get your connection string:**
   - Go back to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)
   - **Replace `<password>` with your actual database password**

6. **Add to backend .env:**
   ```bash
   MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/?appName=Cluster0
   ```

### Option 2: Local MongoDB

If you prefer to run MongoDB locally:

1. **Install MongoDB:**
   - Download: [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your OS

2. **Start MongoDB:**
   ```bash
   # Windows (if installed as service)
   net start MongoDB

   # Mac
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

3. **Add to backend .env:**
   ```bash
   MONGO_URI=mongodb://localhost:27017/career_mate_ai
   ```

---

## Email Configuration

The app uses email for:
- Account verification (OTP codes)
- Password reset

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification" if not already enabled

2. **Generate an App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - You may need to sign in again
   - Select "Mail" and your device type (or "Other")
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Add to backend .env:**
   ```bash
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=abcd efgh ijkl mnop  # 16-character app password
   ```

### Alternative Email Providers

You can also use:
- **Outlook/Hotmail:** Similar app password process
- **Custom SMTP:** Update `config.py` with your SMTP settings

### Testing Email

After starting the backend, try creating a test account. You should receive an OTP email within seconds.

---

## AI Features Configuration

The app uses Google's Gemini AI for:
- Resume analysis
- Cover letter generation
- AI suggestions

### Get Your Gemini API Key

1. **Go to Google AI Studio:**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account

2. **Create an API key:**
   - Click "Create API Key"
   - Select an existing Google Cloud project or create a new one
   - Copy your API key

3. **Add to backend .env:**
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

### Free Tier Limits

Gemini API offers a generous free tier:
- 60 requests per minute
- Enough for development and testing

---

## OAuth Setup (Optional)

OAuth allows users to sign in with Google or GitHub. **This is completely optional** - regular email/password authentication works without this.

### Google OAuth

1. **Go to Google Cloud Console:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Sign-In:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Configure consent screen if prompted
   - Select "Web application" as type
   - Add authorized redirect URIs:
     - `http://localhost:8081`
     - `http://YOUR_LOCAL_IP:8081`
     - `aicarrermateapp://oauth`

3. **Get credentials:**
   - Copy your Client ID and Client Secret

4. **Add to both .env files:**

   **Backend** (`career_mate_backend/.env`):
   ```bash
   GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
   ```

   **Frontend** (`.env`):
   ```bash
   EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
   ```

5. **Update app.json:**
   - Open `app.json`
   - Find `iosUrlScheme` (line ~51)
   - Replace with your reversed client ID:
     ```json
     "iosUrlScheme": "com.googleusercontent.apps.YOUR_CLIENT_ID"
     ```
   - Example: If client ID is `123-abc.apps.googleusercontent.com`, use `com.googleusercontent.apps.123-abc`

### GitHub OAuth

1. **Go to GitHub Developer Settings:**
   - Visit [GitHub OAuth Apps](https://github.com/settings/developers)
   - Click "New OAuth App"

2. **Configure the app:**
   - Application name: "Career Mate AI"
   - Homepage URL: `http://localhost:8081`
   - Authorization callback URL: `aicarrermateapp://oauth`

3. **Get credentials:**
   - Copy your Client ID
   - Generate and copy Client Secret

4. **Add to both .env files:**

   **Backend** (`career_mate_backend/.env`):
   ```bash
   GITHUB_OAUTH_CLIENT_ID=your_github_client_id
   GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret
   ```

   **Frontend** (`.env`):
   ```bash
   EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID=your_github_client_id
   EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret
   ```

---

## Testing the App

Once both backend and frontend are running, test the basic functionality:

### Basic Test Flow

1. **Verify login screen loads**
   - Should see Career Mate AI logo and login form

2. **Create a test account:**
   - Click "Create Account" / "Sign Up"
   - Fill in:
     - Name: "Test User"
     - Email: Your real email (to receive OTP)
     - Username: "testuser"
     - Password: "TestPass123!"

3. **Check email for OTP:**
   - Check your inbox (and spam folder)
   - You should receive a 6-digit code

4. **Verify account:**
   - Enter the OTP code
   - Account should be verified

5. **Login:**
   - Use your username/email and password
   - Should navigate to home screen

6. **Test resume upload:**
   - Navigate to Resume section
   - Paste some sample resume text
   - Upload it

7. **Test cover letter generation:**
   - Go to Cover Letter section
   - Paste a job description
   - Click "Generate Cover Letter"
   - AI should generate a cover letter

If all these steps work, congratulations! Your app is fully functional! 🎉

---

## Troubleshooting

### Backend Issues

#### Backend won't start - MongoDB connection error

**Error:** `pymongo.errors.ServerSelectionTimeoutError` or `MongoDB connection failed`

**Solutions:**
- Verify your `MONGO_URI` is correct
- Check your MongoDB Atlas password (no special characters that need encoding?)
- Make sure IP address is whitelisted in MongoDB Atlas
- If using local MongoDB, ensure it's running: `mongod --version`

#### Backend won't start - Port 5000 already in use

**Error:** `Address already in use` or `Port 5000 is already in use`

**Solutions:**

**Windows:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**Or** change the port in `career_mate_backend/.env`:
```bash
PORT=5001
```
(Also update frontend `EXPO_PUBLIC_API_URL` to match)

#### Backend runs but email not sending

**Error:** OTP emails not arriving

**Solutions:**
- Verify you're using an **App Password**, not your regular Gmail password
- Check spam/junk folder
- Verify `MAIL_USERNAME` is your full email address
- Test with a different email address
- Check backend logs for email sending errors

#### AI features not working

**Error:** Cover letter generation fails

**Solutions:**
- Verify `GEMINI_API_KEY` is correct (no extra spaces)
- Check you haven't exceeded free tier limits
- Ensure Gemini API is enabled in Google Cloud Console
- Test the API key with a simple curl request

### Frontend Issues

#### Cannot connect to backend

**Error:** Network request failed, timeout errors

**Solutions:**
- Verify backend is running (check terminal with `python run.py`)
- Check `EXPO_PUBLIC_API_URL` in `.env`
- Make sure your device and computer are on the **same WiFi network**
- Try pinging your backend: `ping 192.168.x.x` (use your IP)
- Check firewall isn't blocking port 5000
- **Android emulator:** Use `http://10.0.2.2:5000`
- **iOS simulator:** Use `http://localhost:5000`

#### Expo won't start

**Error:** Metro bundler errors, "Cannot find module"

**Solutions:**
```bash
# Clear all caches
npx expo start --clear

# If that doesn't work, reset completely:
rm -rf node_modules
npm install
npx expo start --clear
```

#### Changes to .env not taking effect

**Problem:** Updated environment variables but app still uses old values

**Solution:**
```bash
# Stop Expo (Ctrl+C)
# Clear cache and restart
npx expo start --clear

# For persistent issues:
npx expo start -c
```

#### App loads but screens are blank

**Solutions:**
- Check backend is running
- Check React Native logs in terminal
- Try reloading the app (shake device → "Reload")
- Check for JavaScript errors in Expo DevTools

### OAuth Issues

#### OAuth buttons don't work

**If OAuth is optional and you haven't configured it:**
- This is expected! Regular email/password login should still work
- Skip OAuth setup for now

**If you configured OAuth but it's not working:**
- Verify Client IDs in both `.env` files match
- Check redirect URIs in Google Cloud Console / GitHub settings
- Make sure `app.json` has correct `iosUrlScheme` (for iOS)
- Try restarting Expo after changing OAuth config

### General Issues

#### "Something went wrong" or generic errors

**Steps:**
1. Check backend terminal for error logs
2. Check frontend terminal for JavaScript errors
3. Check Expo DevTools console (usually at `http://localhost:8081`)
4. Try clearing cache: `npx expo start --clear`
5. Check all `.env` variables are set correctly

#### Still having issues?

1. **Check the logs:** Both backend (Python) and frontend (Expo) terminals show detailed error messages
2. **Verify all prerequisites:** Ensure Node.js, Python, and dependencies are installed
3. **Double-check .env files:** Make sure there are no typos or missing values
4. **Search for specific error messages:** Copy the exact error and search online

---

## Additional Notes

### Development vs Production

This setup is for **local development**. For production deployment:

- Change `FLASK_SECRET` to a strong random key
- Change `EMAIL_SALT` to a random string
- Use production-grade database (not free tier MongoDB)
- Enable HTTPS for backend
- Configure proper OAuth redirect URIs
- Set `FLASK_ENV=production` in backend .env

### Expo Dev Server vs Backend API

**Important distinction:**
- **Expo Dev Server** (port 8081): Frontend development server, serves React Native app
- **Backend API** (port 5000): Flask server, handles API requests, database, AI

**Both must be running simultaneously!** Keep two terminal windows open.

### Updating Dependencies

```bash
# Frontend
npm update

# Backend
pip install --upgrade -r requirements.txt
```

---

## Quick Reference

### Start Commands

```bash
# Backend (in career_mate_backend/)
python run.py

# Frontend (in project root)
npx expo start --clear
```

### Environment Variables Checklist

**Backend (.env in career_mate_backend/):**
- ✅ FLASK_SECRET
- ✅ MONGO_URI
- ✅ GEMINI_API_KEY
- ✅ MAIL_USERNAME
- ✅ MAIL_PASSWORD

**Frontend (.env in project root):**
- ✅ EXPO_PUBLIC_API_URL

**Optional (both files):**
- ⬜ OAuth credentials

### Useful Commands

```bash
# Clear Expo cache
npx expo start --clear

# Check Python version
python --version

# Check Node version
node --version

# Check if port 5000 is in use
# Windows
netstat -ano | findstr :5000
# Mac/Linux
lsof -ti:5000

# Find local IP
# Windows
ipconfig
# Mac/Linux
ifconfig
```

---

## Need Help?

- Check backend logs in the terminal
- Check frontend logs in Expo DevTools
- Review the [Troubleshooting](#troubleshooting) section
- Verify all [Prerequisites](#prerequisites) are installed

Good luck, and enjoy building with Career Mate AI! 🚀
