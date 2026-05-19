"""
Purrfect Care — Supabase Database Client

Provides singleton Supabase clients for both anon (frontend-facing)
and service-role (backend operations that bypass RLS) access.
"""

from functools import lru_cache

from supabase import create_client, Client

from app.config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """
    Returns a Supabase client using the SERVICE ROLE key.
    This client bypasses Row Level Security (RLS) — use only in backend services.
    """
    settings = get_settings()
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY,
    )


@lru_cache()
def get_supabase_anon_client() -> Client:
    """
    Returns a Supabase client using the ANON key.
    This client respects RLS policies — use for auth operations.
    """
    settings = get_settings()
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_ANON_KEY,
    )
