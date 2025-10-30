import smtplib
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import MAIL_USERNAME, MAIL_PASSWORD
from PyPDF2 import PdfReader

def send_email(to_email, subject, body):
    """
    Sends an email using smtplib for Gmail.
    """
    msg = MIMEMultipart()
    msg["From"] = MAIL_USERNAME
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_USERNAME, to_email, msg.as_string())
        server.quit()
        # Mask email for privacy in logs
        masked_email = to_email[:3] + "***@" + to_email.split('@')[1] if '@' in to_email else "***"
        print(f"✅ Email sent to {masked_email}")
        return True
    except Exception as e:
        print(f"❌ Error sending email: {str(e)[:50]}...")
        return False

def extract_text_from_pdf_bytes(file_bytes):
    """
    Accepts bytes (from Multipart file), returns extracted text.
    If PDF parse fails, returns empty string.
    """
    try:
        reader = PdfReader(file_bytes)
        text = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
        return "\n".join(text)
    except Exception as e:
        print("PDF parse error:", e)
        return ""

def sanitize_text(text):
    """
    Removes extra whitespace and strips leading/trailing spaces.
    """
    text = re.sub(r"\s+", " ", text)
    return text.strip()