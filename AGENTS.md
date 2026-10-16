# Quello — Agent Instructions

Quello is a RAG-powered AI workspace: users upload PDFs and documents,
organize them in team workspaces, and ask questions grounded in their content.
FastAPI backend (Python), Next.js frontend (TypeScript).

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router), Tailwind CSS v4, TypeScript | Next.js 16, React 19 |
| Backend | FastAPI, Python, Uvicorn | FastAPI 0.115, Python 3.11+ |
| Database | MongoDB Atlas (Motor async driver) | Motor 3.6 |
| Vector Store | Qdrant Cloud | qdrant-client 1.12+ |
| Embeddings | Google Text Embedding (gemini-embedding-2) | via langchain-google-genai |
| LLMs | Google Gemini 2.5 Flash, Groq Llama 3.3 70B | via langchain |
| Auth | Google OAuth | — |
| Deployment | Vercel (frontend), Render (backend) | — |

## How to Run

### Backend
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API at `http://localhost:8000`, docs at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App at `http://localhost:3000`.

Design tokens in `docs/design-system.md` are canonical for `frontend/src/**`.

## Folder Structure

```
DocsChat/
├── AGENTS.md               # Agent instructions (this file)
├── backend/                # FastAPI app (app/, tests/)
├── frontend/               # Next.js app (src/)
├── docs/                   # Design system, reference screenshots
└── .github/workflows/      # CI (pytest, lint, typecheck)
```

## Verify Before Handover

Run only the gates for the stack touched:

- **Backend:** full `pytest` passes; `flake8 app/ --select=F,E9` clean.
- **Frontend:** `npm run lint` with 0 errors and 0 warnings; `npx tsc --noEmit` clean.

Hand over green work with test results. The user verifies the change itself.

## Hard Boundaries

1. Never edit `.env` files — they contain secrets. Only edit `.env.example`.
2. Never delete user data, MongoDB collections, or Qdrant collections.
3. Never hardcode API keys, secrets, or credentials in source code.
4. Work directly on `main` with atomic Conventional Commits. Never commit or push without the user's explicit YES.
5. The agent runs all verifications itself (lint, `pytest`, `tsc`, diagnostics). Never ask the user to act as QA.
