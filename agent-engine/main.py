"""
Agent Engine — FastAPI Backend for Antigravity Agent Intelligence

Endpoints:
- POST /crush     — Compress context (SmartCrusher)
- POST /memory    — Save a memory
- GET  /recall    — Search memories
- GET  /context   — Get live context summary for AI
- GET  /fleet     — Get fleet status
- GET  /inbox     — Get inbox items
- GET  /health    — Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from crusher import crusher, SmartCrusher
from config import PORT

app = FastAPI(
    title="Antigravity Agent Engine",
    description="Python backend for agent intelligence — compression, memory, orchestration",
    version="0.1.0",
)

# CORS — allow Next.js dashboard to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════
# Request/Response Models
# ═══════════════════════════════════════

class CrushRequest(BaseModel):
    content: str | list | dict
    max_chars: int = 4000

class CrushResponse(BaseModel):
    original_chars: int
    crushed_chars: int
    savings_pct: float
    content: str
    hash: str

class MemoryRequest(BaseModel):
    content: str
    category: str = "NOTE"

class MemoryResponse(BaseModel):
    saved: bool
    id: str | None = None

class RecallQuery(BaseModel):
    query: str
    limit: int = 5


# ═══════════════════════════════════════
# Smart Crusher Endpoints
# ═══════════════════════════════════════

@app.post("/crush", response_model=CrushResponse)
async def crush_context(req: CrushRequest):
    """Compress context using SmartCrusher pipeline."""
    c = SmartCrusher(max_chars=req.max_chars)
    result = c.crush(req.content)
    return CrushResponse(
        original_chars=result.original_chars,
        crushed_chars=result.crushed_chars,
        savings_pct=result.savings_pct,
        content=result.content,
        hash=result.originals_hash,
    )

@app.get("/crush/{content_hash}")
async def retrieve_original(content_hash: str):
    """Retrieve original uncompressed content by hash."""
    original = crusher.retrieve(content_hash)
    if not original:
        raise HTTPException(status_code=404, detail="Original content not found")
    return {"content": original}


# ═══════════════════════════════════════
# Custodian Memory Endpoints
# ═══════════════════════════════════════

@app.post("/memory", response_model=MemoryResponse)
async def save_memory(req: MemoryRequest):
    """Save a decision, note, or review to persistent memory."""
    try:
        from memory import custodian
        if not custodian:
            raise HTTPException(status_code=503, detail="Supabase not configured")
        result = custodian.save(req.content, req.category)
        return MemoryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recall")
async def recall_memories(query: str, limit: int = 5):
    """Search past decisions/memories by keyword."""
    try:
        from memory import custodian
        if not custodian:
            raise HTTPException(status_code=503, detail="Supabase not configured")
        return {"results": custodian.recall(query, limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/context")
async def get_context():
    """Get live context summary for AI prompt injection."""
    try:
        from memory import custodian
        if not custodian:
            return {"context": "Supabase not configured — running without memory."}
        return {"context": custodian.build_context_summary()}
    except Exception as e:
        return {"context": f"Context build error: {str(e)}"}


# ═══════════════════════════════════════
# Fleet & Inbox Endpoints
# ═══════════════════════════════════════

@app.get("/fleet")
async def get_fleet():
    """Get agent fleet status."""
    try:
        from memory import custodian
        if not custodian:
            raise HTTPException(status_code=503, detail="Supabase not configured")
        return {"agents": custodian.get_fleet_status()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/inbox")
async def get_inbox(status: str = "NEW", limit: int = 10):
    """Get inbox items."""
    try:
        from memory import custodian
        if not custodian:
            raise HTTPException(status_code=503, detail="Supabase not configured")
        return {"items": custodian.get_inbox(status, limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════
# Health Check
# ═══════════════════════════════════════

@app.get("/health")
async def health():
    """Service health check."""
    db_ok = False
    try:
        from memory import custodian
        if custodian:
            custodian.get_fleet_status()
            db_ok = True
    except:
        pass

    return {
        "status": "online",
        "service": "agent-engine",
        "version": "0.1.0",
        "database": "connected" if db_ok else "disconnected",
        "crusher": "ready",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
