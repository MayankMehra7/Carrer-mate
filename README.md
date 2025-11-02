# Career Mate AI

An intelligent career assistance mobile application built with React Native and Flask that helps users create professional resumes, generate tailored cover letters, and manage their job application process using AI-powered features.

## Features

- **User Authentication**
  - Email/password signup and login
  - OAuth integration (Google & GitHub)
  - Email verification with OTP
  - Password reset functionality

- **Resume Management**
  - Upload and store resume content
  - AI-powered resume analysis using Google Gemini
  - Extract text from document files
  - Get intelligent suggestions for improvement

- **Cover Letter Generation**
  - AI-generated cover letters tailored to job descriptions
  - Generate from stored resume or custom input
  - Save and manage multiple cover letters

- **AI-Powered Suggestions**
  - Personalized career advice
  - Resume optimization tips
  - Interview preparation guidance

## Tech Stack

### Frontend
- **React Native** 0.81.5
- **Expo** 54
- **React Navigation** 7
- **AsyncStorage** for local data
- **Google Sign-In** & OAuth support

### Backend
- **Flask** 3.1.2
- **MongoDB** (via pymongo 4.4.0)
- **Google Gemini AI** for intelligent features
- **Flask-Mail** for email services
- **OAuth** support for Google & GitHub

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or MongoDB Atlas)
- Gmail account (for email features)
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Carrer-mate
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd career_mate_backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Configure environment variables**

   Create `.env` files for both frontend and backend. See [SETUP.md](SETUP.md) for detailed instructions.

   **Backend** (`career_mate_backend/.env`):
   ```bash
   FLASK_SECRET=your_secret_key
   MONGO_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_gmail_app_password
   ```

   **Frontend** (`.env`):
   ```bash
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
   ```

5. **Start the backend server**
   ```bash
   cd career_mate_backend
   python run.py
   ```

6. **Start the frontend (in a new terminal)**
   ```bash
   npx expo start --clear
   ```

7. **Open the app**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## Detailed Setup Guide

For comprehensive setup instructions including:
- MongoDB configuration (Atlas & local)
- Email setup with Gmail
- Getting API keys
- OAuth configuration
- Troubleshooting common issues

**See [SETUP.md](SETUP.md) for complete documentation.**

## Project Structure

```
Carrer-mate/
├── src/                      # Frontend source code
│   ├── api/                  # API client
│   ├── components/           # Reusable components
│   ├── screens/              # App screens
│   ├── navigation/           # Navigation configuration
│   └── contexts/             # React contexts
├── career_mate_backend/      # Backend Flask application
│   ├── routes.py             # API routes
│   ├── models.py             # Database models
│   ├── db.py                 # Database connection
│   ├── config.py             # Configuration
│   └── run.py                # Entry point
├── assets/                   # Images and static files
├── .env                      # Frontend environment variables
├── .env.example              # Frontend env template
├── app.json                  # Expo configuration
├── package.json              # Frontend dependencies
├── SETUP.md                  # Detailed setup guide
└── README.md                 # This file
```

## Environment Variables

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API URL (e.g., http://192.168.1.100:5000) |
| `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | No | Google OAuth Client ID (optional) |
| `EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID` | No | GitHub OAuth Client ID (optional) |

### Backend (career_mate_backend/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `FLASK_SECRET` | Yes | Secret key for Flask sessions |
| `MONGO_URI` | Yes | MongoDB connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini AI API key |
| `MAIL_USERNAME` | Yes | Email address for sending emails |
| `MAIL_PASSWORD` | Yes | Email app password |
| `PORT` | No | Server port (default: 5000) |
| `GOOGLE_OAUTH_CLIENT_ID` | No | Google OAuth credentials (optional) |
| `GITHUB_OAUTH_CLIENT_ID` | No | GitHub OAuth credentials (optional) |

## API Endpoints

### Authentication
- `POST /api/signup` - Create new account
- `POST /api/verify-otp` - Verify email with OTP
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password

### Resume & Cover Letter
- `POST /api/upload_resume` - Upload resume content
- `GET /api/get_resume` - Get stored resume
- `POST /api/generate_cover_letter` - Generate cover letter
- `POST /api/generate_cover_from_stored` - Generate from stored resume
- `POST /api/accept_cover_letter` - Save cover letter
- `POST /api/extract_file_text` - Extract text from file

### AI Features
- `POST /api/get_ai_suggestions` - Get AI-powered suggestions

### OAuth
- `POST /api/oauth/google` - Google OAuth login
- `POST /api/oauth/github` - GitHub OAuth login

## Development

### Running Tests

Backend tests:
```bash
cd career_mate_backend
python -m pytest
```

### Clearing Cache

If you encounter issues, clear the Expo cache:
```bash
npx expo start --clear
```

### Debugging

- **Frontend logs:** Check Expo DevTools at http://localhost:8081
- **Backend logs:** Check terminal running `python run.py`
- **Network issues:** Verify backend is running and API URL is correct

## Troubleshooting

### Cannot connect to backend
- Ensure backend is running (`python run.py`)
- Check `EXPO_PUBLIC_API_URL` matches your backend IP
- Verify both devices are on the same network
- For Android emulator, use `http://10.0.2.2:5000`

### MongoDB connection failed
- Verify `MONGO_URI` is correct
- Check MongoDB is running (if local)
- Ensure IP is whitelisted in MongoDB Atlas

### Email not sending
- Use Gmail App Password, not regular password
- Enable 2-Factor Authentication on Google account
- Check spam folder

**See [SETUP.md](SETUP.md) for comprehensive troubleshooting.**

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For setup help and troubleshooting:
- Read [SETUP.md](SETUP.md) for detailed instructions
- Check the [Troubleshooting](#troubleshooting) section
- Review backend and frontend logs for error messages

## Acknowledgments

- Built with [Expo](https://expo.dev)
- Powered by [Google Gemini AI](https://ai.google.dev/)
- Uses [MongoDB](https://www.mongodb.com/) for data storage
- Authentication with [Flask](https://flask.palletsprojects.com/)
