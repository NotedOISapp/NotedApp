# Agent Engine - Python Backend for Antigravity Agent Intelligence

A FastAPI service providing:
- **Context Compression** (SmartCrusher from Headroom)
- **Memory Persistence** (Athena-style Custodian)
- **Agent Orchestration** endpoints

## Setup
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Architecture
- `main.py` — FastAPI app with routes
- `crusher.py` — SmartCrusher context compression
- `memory.py` — Custodian memory management
- `config.py` — Environment config
