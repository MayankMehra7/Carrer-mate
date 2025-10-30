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

# Mongo client
client = MongoClient(MONGO_URI)
db = client["career_mate_ai"]

# Flask-Mail instance created in run.py after app exists.
mail = Mail()
