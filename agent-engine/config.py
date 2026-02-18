import os
from dotenv import load_dotenv
from pathlib import Path

print(f"DEBUG: CWD={os.getcwd()}")
env_path = Path(__file__).resolve().parent / '.env'
print(f"DEBUG: Loading env from {env_path}, exists={env_path.exists()}")

# Manual Fallback if dotenv fails
def manual_load(path):
    try:
        with open(path, 'r', encoding='utf-8-sig') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, val = line.strip().split('=', 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and val:
                        os.environ[key] = val
                        print(f"DEBUG: Manually loaded {key}")
    except Exception as e:
        print(f"DEBUG: Manual load failed: {e}")

manual_load(env_path)
load_dotenv(dotenv_path=env_path, override=True) # Let dotenv verify/override if it works

api_key = os.getenv('GOOGLE_API_KEY')
print(f"DEBUG: GOOGLE_API_KEY loaded: {bool(api_key)}, length={len(api_key) if api_key else 0}")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Google AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Service
PORT = int(os.getenv("PORT", "8000"))
MIN_POLL_INTERVAL = int(os.getenv("MIN_POLL_INTERVAL", "45"))
MAX_POLL_INTERVAL = int(os.getenv("MAX_POLL_INTERVAL", "90"))
