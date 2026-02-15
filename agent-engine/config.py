import os
from dotenv import load_dotenv

load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Google AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Service
PORT = int(os.getenv("PORT", "8000"))
