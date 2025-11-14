# config.py
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from flask_mail import Mail, Message

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
FLASK_SECRET = os.getenv("FLASK_SECRET", "change_me")
PORT = int(os.getenv("PORT", 5000))

# Mongo client - lazy connection (don't test on import, allow server to start)
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is not set. Please check your .env file.")

# Create client without testing connection immediately (lazy connection)
# This allows the app to start even if MongoDB isn't running yet
# Connection will be tested when first database operation is attempted
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, connect=False)
db = client["career_mate_ai"]

def test_mongodb_connection():
    """Test MongoDB connection and print status. Call this to verify connection."""
    try:
        client.server_info()
        print(f"✓ Connected to MongoDB: {MONGO_URI}")
        return True
    except Exception as e:
        print(f"\n✗ MongoDB connection failed: {e}")
        print(f"  MONGO_URI: {MONGO_URI}")
        print("\n  To fix this:")
        print("  1. Make sure MongoDB is installed")
        print("  2. Start MongoDB service:")
        print("     - Windows: Open Services (Win+R, type 'services.msc')")
        print("     - Find 'MongoDB' and click 'Start'")
        print("     - OR run: mongod --dbpath \"C:\\data\\db\"")
        print("  3. Verify MongoDB is running: mongosh")
        print("\n  The server will start but database operations will fail until MongoDB is running.\n")
        return False

# Try to test connection on import, but don't crash if it fails
try:
    test_mongodb_connection()
except Exception:
    # Connection test failed, but server can still start
    print("⚠ MongoDB connection test skipped. Server will start but database operations may fail.")
    print("  Start MongoDB and the connection will work automatically.\n")

# Flask-Mail instance created in run.py after app exists.
mail = Mail()
