<p align="center">
  <a href="https://github.com/faizjamadar18/DocsChat/actions/workflows/ci.yml"><img src="https://github.com/faizjamadar18/DocsChat/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/Qdrant-Vector_Search-DC244C?style=flat" alt="Qdrant" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat" alt="MIT License" />
</p>

<div align="center">
  <h1 align="center">Quello</h1>
<a id="readme-top"></a>

<p align="center">
    Turn documents into answers, instantly.
    <br />
    A team-ready RAG workspace: upload PDFs, write docs in the Studio,
    connect Notion / Drive / GitHub, and chat with your knowledge —
    every answer grounded in your sources.
    <br />
    <br />
    <a href="https://docschats.vercel.app">Live Demo</a>
    ·
    <a href="#features">Features</a>
    ·
    <a href="#architecture">Architecture</a>
    ·
    <a href="#getting-started">Getting Started</a>
    ·
    <a href="#deployment">Deployment</a>
    ·
    <a href="#api">API</a>
  </p>
</div>

<br />

## 📺 Demo Video

<div align="center">

[![Watch the Quello Demo](https://img.youtube.com/vi/AbhWGvJf2E8/maxresdefault.jpg?v=2)](https://www.youtube.com/watch?v=AbhWGvJf2E8&t=4s)

</div>

<br />

## Features

- **RAG-Powered Q&A** — ask questions against uploads, Studio docs, and connected apps. Answers stream token-by-token (SSE) and cite their sources.
- **Multi-Model LLMs** — Google Gemini 2.5 Flash and Groq-hosted models via LangChain, switchable per question.
- **Team Workspaces** — shared rooms with roles, member management, and email invites.
- **Studio Editor** — write and AI-refactor documents in a rich text editor.
- **Connectors** — import knowledge from Notion, Google Drive, and GitHub (OAuth, read-only).
- **Voice Agent** — talk to your workspace via Vapi (bring your own public key, stored encrypted).
- **MCP Server** — expose workspace knowledge to MCP clients (Claude, Grok) over Streamable HTTP, with per-user API keys and OAuth discovery.
- **Google Sign-In** — one-click OAuth, JWT sessions.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Next.js 16  │────▶│    FastAPI       │────▶│  MongoDB     │
│  (Vercel)    │◀────│  (Render)        │     │  Atlas       │
└──────────────┘     └────────┬─────────┘     └──────────────┘
                               ├──────────────▶│  Qdrant      │
                               │               │  (vectors)   │
                               └──────────────▶│  R2 / local  │
                                               │  (PDF bytes) │
```

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, TipTap, Geist Sans | Vercel |
| Backend | FastAPI 0.115, Python 3.11+, Uvicorn | Render |
| Database | MongoDB Atlas via Motor (users, workspaces, docs, threads) | MongoDB Atlas |
| Vector Store | Qdrant Cloud (per-workspace vectors) | Qdrant Cloud |
| File Storage | Cloudflare R2 (local `uploads/` fallback in dev) | Cloudflare R2 |
| Embeddings | Google Text Embedding via `langchain-google-genai` | — |
| LLMs | Google Gemini 2.5 Flash / Groq models via LangChain | — |
| Auth | Google OAuth + JWT (python-jose) | — |

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB Atlas cluster (or local MongoDB)
- Qdrant Cloud cluster (or local Qdrant)
- [Google AI API key](https://aistudio.google.com/apikey)
- [Groq API key](https://console.groq.com/)
- Google OAuth client ID (for sign-in)

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys and database URL

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional — same-origin /api proxy is the default)
cp .env.example .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

#### Backend (`backend/.env` — see `.env.example` for the full list)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URL` | Yes | MongoDB Atlas connection string |
| `DB_NAME` | No | Database name (default: `quello`) |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `GROQ_API_KEY` | Yes | Groq API key |
| `QDRANT_URL` / `QDRANT_API_KEY` | Yes | Qdrant Cloud endpoint + key |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `CORS_ORIGINS` | No | Comma-separated allowed frontend origins |
| `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | No | Cloudflare R2 (empty = local `uploads/` fallback) |

#### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Backend origin, e.g. `https://your-render-app.onrender.com` (default: same-origin `/api` proxy) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID (sign-in button) |

> **For production (Vercel):** set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the Vercel dashboard. Local `.env` files are gitignored and never deployed.

## Deployment

### Render (Backend)

1. Create a new **Web Service** on Render and connect this repository.
2. Set **Root Directory** to `backend/`.
3. Set **Build Command** to `pip install -r requirements.txt`.
4. Set **Start Command** to `bash start.sh`.
5. Add the required environment variables in the Render dashboard (`MONGODB_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `GOOGLE_CLIENT_ID`, `CORS_ORIGINS`, `DB_NAME`).

A `render.yaml` blueprint is included in `backend/` for one-click infrastructure setup.

> **Note (free tier):** Render sleeps idle free services; the first request after sleep takes ~1 minute. The landing page pings `GET /api/health` on load so warm-up starts while visitors read, and `/health` answers instantly without waiting on the database.

### Vercel (Frontend)

1. Import the `frontend/` directory as a new Vercel project.
2. Add environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-render-app.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | your Google OAuth client ID |

3. Deploy. No additional configuration required.

## API

Auth: Google sign-in returns a JWT; send it as an `Authorization: Bearer <token>` header on `/api/*` calls.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe (instant, includes `db_ready`) |
| `GET` | `/api/health` | Same probe under `/api` (frontend warm-up) |
| `GET` | `/health/db` | Database connectivity check |
| `POST` | `/api/auth/google` | Google sign-in, returns JWT (+ optional `invite_token`) |
| `GET` / `PATCH` | `/api/auth/me`, `/api/auth/profile`, `/api/auth/onboarding` | Current user, profile, onboarding |
| `DELETE` | `/api/auth/account` | Delete account |
| `GET` / `POST` | `/api/workspaces`, `/api/workspaces/{id}`, `/{id}/dashboard`, `/{id}/activate` | Workspaces CRUD + dashboard |
| `GET` / `POST` / `DELETE` | `/api/workspaces/{id}/members`, `/invites`, `.../leave` | Members, invites (email), leave |
| `GET` / `POST` | `/api/sources`, `/api/sources/upload` (PDF, 20MB max), `/{id}`, `/{id}/download` | Uploaded PDFs |
| `DELETE` | `/api/sources/{id}` | Delete a source |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/documents`, `/{id}`, `/{id}/index`, `/{id}/ai-refactor` | Studio documents + AI tools |
| `GET` / `POST` | `/api/chat/threads`, `/threads/{id}/messages` | Chat threads |
| `POST` | `/api/chat/ask` | Ask a question (SSE stream) |
| `GET` / `DELETE` | `/api/chat/history`, `/api/chat/clear` | History, clear |
| `GET` / `POST` | `/api/connectors/status`, `/notion|drive|github/auth-url`, `.../callback`, `.../import` | Notion / Drive / GitHub |
| `POST` / `DELETE` | `/api/connectors/sources/{id}/resync`, `/api/connectors/{provider}` | Resync, disconnect |
| `GET` / `PUT` / `DELETE` | `/api/voice/key`, `/key-status` | Vapi public key (BYOK, encrypted) |
| `POST` | `/api/voice/session`, `/bootstrap`, `/tool-call` | Voice sessions |
| `GET` / `POST` / `DELETE` | `/api/voice/logs` | Voice call logs |
| `POST` / `GET` / `DELETE` | `/api/mcp-keys` | Per-user MCP API keys |
| `POST` / `GET` / `DELETE` | `/mcp`, `/api/mcp` | MCP server (Streamable HTTP) |

Full interactive reference: `/docs` on a running backend.

## Testing

```bash
# Backend (28 test files, mocked DB — no Atlas needed)
cd backend
pip install -r requirements-dev.txt
python -m pytest -q
flake8 app/ --select=F,E9

# Frontend
cd frontend
npm run lint
npx tsc --noEmit
```

CI runs all of this on every push (see `.github/workflows/ci.yml`).

## Smoke Test

1. Open the app and **continue with Google**.
2. Upload a PDF via **Add source** and wait for *Ready*.
3. Ask a question in chat — verify the streamed answer cites sources.
4. Start a second thread — verify history is per-thread.
5. Create a workspace, invite a teammate, verify roles.

## Known Limitations

- Render free tier sleeps when idle (~1 min first wake; landing-page warm-up softens it).
- PDF uploads only, 20MB max per file.
- Requires MongoDB Atlas + Qdrant + Google/Groq keys to run fully.
- No JWT refresh rotation yet.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Bug reports and small PRs welcome.

## License

MIT — see [LICENSE](./LICENSE).

<p align="right"><a href="#readme-top">back to top ▲</a></p>
