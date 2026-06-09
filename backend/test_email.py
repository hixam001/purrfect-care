import os
import resend
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")
from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")

if len(sys.argv) < 2:
    print("Usage: python test_email.py <your-email>")
    sys.exit(1)

target_email = sys.argv[1]

print(f"Sending test email to {target_email} from {from_email}...")

try:
    params = {
        "from": f"Purrfect Care <{from_email}>",
        "to": [target_email],
        "subject": "Purrfect Care — Test Email!",
        "html": "<strong>It works!</strong><br><p>This is a test email sent from the Purrfect Care backend using Resend.</p>",
    }
    
    email = resend.Emails.send(params)
    print(f"Success! Email sent. ID: {email['id']}")
except Exception as e:
    print(f"Failed to send email: {str(e)}")
