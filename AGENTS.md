# DocsChat — Agent Instructions

> **Read this file completely before writing any code.**
> This is the single source of truth for all AI agents (Antigravity, Claude Code, Cursor, etc.) working on this project.

---

## Project Overview

DocsChat is a RAG-powered AI workspace that lets users upload PDFs, write documents, and ask an AI assistant questions grounded in their content. It uses a FastAPI backend (Python) and a Next.js frontend (TypeScript).

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router), Tailwind CSS v4, TypeScript | Next.js 16, React 19 |
| Backend | FastAPI, Python, Uvicorn | FastAPI 0.115, Python 3.11+ |
| Database | MongoDB Atlas (Motor async driver) | Motor 3.6 |
| Vector Store | Qdrant Cloud (migrating from ChromaDB) | qdrant-client 1.12+ |
| Embeddings | Google Text Embedding (gemini-embedding-2) | via langchain-google-genai |
| LLMs | Google Gemini 2.5 Flash, Groq Llama 3.3 70B | via langchain |
| Auth | Google OAuth | — |
| Deployment | Vercel (frontend), Render (backend) | — |

---

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

---

## Folder Structure

```
DocsChat/
├── AGENTS.md                    # ← Master instructions
├── IMPLEMENTATION_PLAN.md       # Roadmap for evolution
├── backend/                     # FastAPI python app
├── frontend/                    # Next.js app
└── .agents/                     # AI Skills & Workflows
```

---

## Subagent Roles

When multiple agents work in parallel, they must respect these boundaries:

| Role | Responsibility | May Touch |
|------|---------------|-----------|
| **Planner** | Produce implementation plan | Any file (read-only) |
| **Implementer** | Write code to fulfill the core goal. Do not follow the plan exactly if it is flawed. Think out of the box and deviate from the plan if a better external implementation exists. Stop and notify if a major blocker arises. | `backend/app/`, `frontend/src/` |
| **Reviewer** | Audits code against plan. | Any file (read-only) |

---

## Hard Boundaries — NEVER Do These

> [!CAUTION]
> Violating any of these will break the project or compromise security.

1. **NEVER** edit `.env` files — they contain secrets. Only edit `.env.example`.
2. **NEVER** delete user data, MongoDB collections, or Qdrant collections.
3. **NEVER** push directly to `main` — always use feature branches and PRs.
4. **NEVER** hardcode API keys, secrets, or credentials in source code.
