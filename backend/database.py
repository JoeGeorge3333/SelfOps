import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_ANON_KEY", "")

# In real API endpoints, the supabase client should be initialized using the user's JWT token
# for RLS to work properly. This is the service role / anon fallback client.
supabase: Client = create_client(url, key)
