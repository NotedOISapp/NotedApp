"""
Custodian Memory — Athena-style Persistent Decision Log
Manages memory across sessions using Supabase as the backend.

Features:
- Save decisions, notes, reviews, context to persistent storage
- Search/recall past decisions by keyword
- Session logging (start/end lifecycle)
- Memory summary for context injection
"""

import os
from datetime import datetime, timezone
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY


def get_supabase() -> Client:
    """Get Supabase client."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


class Custodian:
    """Persistent memory manager — the agent's long-term brain."""

    def __init__(self):
        self.db = get_supabase()

    def save(self, content: str, category: str = "NOTE") -> dict:
        """Save a memory entry."""
        result = self.db.table("boss_memory").insert({
            "content": content,
            "category": category.upper(),
        }).execute()
        return {"saved": True, "id": result.data[0]["id"] if result.data else None}

    def recall(self, query: str, limit: int = 5) -> list[dict]:
        """Search memories by keyword."""
        result = self.db.table("boss_memory") \
            .select("*") \
            .ilike("content", f"%{query}%") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        return result.data or []

    def get_recent(self, limit: int = 10) -> list[dict]:
        """Get most recent memories."""
        result = self.db.table("boss_memory") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        return result.data or []

    def get_fleet_status(self) -> list[dict]:
        """Get current agent fleet status."""
        result = self.db.table("agents") \
            .select("*") \
            .order("name") \
            .execute()
        return result.data or []

    def get_inbox(self, status: str = "NEW", limit: int = 10) -> list[dict]:
        """Get inbox items."""
        query = self.db.table("inbox_items") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(limit)
        if status:
            query = query.eq("status", status)
        return query.execute().data or []

    def build_context_summary(self) -> str:
        """Build a compressed context summary for AI prompts."""
        lines = []

        # Fleet
        fleet = self.get_fleet_status()
        if fleet:
            running = sum(1 for a in fleet if a.get("status") == "RUNNING")
            lines.append(f"Fleet: {running}/{len(fleet)} active")
            for a in fleet:
                icon = "🟢" if a["status"] == "RUNNING" else "⚪"
                lines.append(f"  {icon} {a['name']} ({a.get('role', 'N/A')}) — {a['status']}")

        # Recent memories
        memories = self.get_recent(5)
        if memories:
            lines.append("\nRecent Memory:")
            for m in memories:
                lines.append(f"  [{m.get('category', 'NOTE')}] {m['content'][:80]}")

        # Inbox count
        inbox = self.get_inbox()
        lines.append(f"\nInbox: {len(inbox)} unread items")

        return "\n".join(lines)


# Singleton
custodian = Custodian() if SUPABASE_URL and SUPABASE_KEY else None
