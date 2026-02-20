from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client | None:
    """
    Initialize and return a Supabase client.
    Returns None if the credentials are not configured.
    """
    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("Supabase URL or Key is not configured. Supabase APIs will not be available.")
        return None
        
    try:
        supabase: Client = create_client(settings.supabase_url, settings.supabase_key)
        return supabase
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        return None

# Global instance for app components to use
supabase_client = get_supabase_client()
