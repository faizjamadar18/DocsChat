<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/ChromaDB-0.6-FC6D26?style=flat" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat" alt="MIT License" />
</p>

<div align="center">
  <h1 align="center">DocsChat</h1>
<a id="readme-top"></a>

<p align="center">
    Turn documents into answers, instantly.
    <br />
    A RAG-powered research assistant that lets you upload PDFs, ask questions, and get citeable answers — powered by your choice of AI models.
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

## Features

- **RAG-Powered Q&A** — ask natural-language questions against your uploaded documents. Every answer is grounded in your sources.
- **Multi-Model LLM Support** — switch between Google Gemini 1.5 Flash and Groq Llama 3 70B per question, no configuration needed.
- **Source-Grounded Citations** — every answer cites the exact filename and page number. Click to verify in context.
- **Streaming Responses** — answers appear token-by-token as they're generated, with full markdown rendering.
- **Persistent Workspaces** — per-user authentication, file storage, and chat history backed by MongoDB Atlas.
- **Mobile-Responsive Dashboard** — adaptive layout with sidebar drawer, touch-friendly controls, and full mobile preview support.
- **Secure Authentication** — JWT-based auth with bcrypt password hashing (pinned to v4.0.1 for compatibility).

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Next.js 16  │────▶│    FastAPI       │────▶│  MongoDB     │
│  (Vercel)    │◀────│  (Render)        │     │  Atlas       │
└──────────────┘     └────────┬─────────┘     └──────────────┘
                              │
                     ┌────────▼────────┐
                     │  ChromaDB       │
                     │  (vector store) │
                     └─────────────────┘
```

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, Geist Sans | Vercel |
| Backend | FastAPI 0.115, Python 3.11+, Uvicorn + Gunicorn | Render |
| Database | MongoDB Atlas (users, sources, messages, sessions) | MongoDB Atlas |
| Vector Store | ChromaDB 0.6 (in-memory on Render, persistent locally) | — |
| Embeddings | Google Text Embedding 004 via `langchain-google-genai` | — |
| LLMs | Google Gemini 1.5 Flash / Groq Llama 3 70B | — |
| Auth | JWT (python-jose) + bcrypt 4.0.1 | — |

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB Atlas cluster (or local MongoDB instance)
- [Google AI API Key](https://aistudio.google.com/apikey)
- [Groq API Key](https://console.groq.com/)

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

# Configure environment (optional — defaults to localhost:8000)
cp .env.example .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

#### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URL` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `GROQ_API_KEY` | Yes | Groq API key |
| `GOOGLE_EMBEDDING_MODEL` | No | Embedding model (default: `models/text-embedding-004`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `CHROMA_PERSISTENT` | No | Set `true` for persistent local ChromaDB |
| `DB_NAME` | No | MongoDB database name (default: `notebuddy`) |

#### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Backend URL (default: `http://localhost:8000`) |

> **For production (Vercel):** Set `NEXT_PUBLIC_API_URL` in the Vercel dashboard. The `.env` file is gitignored and won't be available at build time.

## Deployment

### Render (Backend)

1. Create a new **Web Service** on Render and connect your GitHub repository.
2. Set **Root Directory** to `backend/`.
3. Set **Build Command** to `pip install -r requirements.txt`.
4. Set **Start Command** to `bash start.sh`.
5. Add the required environment variables in the Render dashboard:

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URL` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Generate a strong random secret |
| `GEMINI_API_KEY` | Yes | Google AI Studio key |
| `GROQ_API_KEY` | Yes | Groq console key |
| `CORS_ORIGINS` | Yes | Comma-separated frontend URLs |
| `CHROMA_PERSISTENT` | Yes | Set to `false` on Render |
| `DB_NAME` | No | Defaults to `notebuddy` |

A `render.yaml` blueprint is included in `backend/` for one-click infrastructure setup.

### Vercel (Frontend)

1. Import the `frontend/` directory as a new Vercel project.
2. Add the environment variable:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-render-app.onrender.com` |

3. Deploy. No additional configuration required.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/health/db` | Database connectivity check |
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Sign in and receive JWT |
| `GET` | `/api/auth/me` | Get current user profile |
| `GET` | `/api/sources` | List uploaded documents |
| `POST` | `/api/sources/upload` | Upload a PDF file |
| `DELETE` | `/api/sources/{id}` | Delete a document |
| `GET` | `/api/chat/history` | Retrieve chat history |
| `POST` | `/api/chat/ask` | Ask a question (SSE stream) |
| `DELETE` | `/api/chat/clear` | Clear chat history |

### Authentication

All `/api/sources/*` and `/api/chat/*` endpoints require a valid JWT token sent as an `Authorization: Bearer <token>` header.

## Smoke Test

1. Navigate to the app and **register** a new account.
2. **Sign in** with your credentials.
3. Click **Add source** in the sidebar and upload a PDF.
4. Wait for the source status to change from *Processing...* to *Ready · N pages*.
5. Type a question in the chat input and press enter.
6. Verify the streamed answer includes source citation chips.
7. Use **Clear chat** to wipe conversation history.
8. Delete a source from the sidebar to remove it permanently.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), Tailwind CSS v4, TypeScript, Geist Sans
- **Backend:** FastAPI 0.115, Python 3.11+, Motor (async MongoDB driver), langchain
- **Database:** MongoDB Atlas, ChromaDB (vector store)
- **AI:** Google Gemini 1.5 Flash, Groq Llama 3 70B, Google Text Embedding 004
- **Auth:** JWT (python-jose), bcrypt 4.0.1 (passlib)
- **Deployment:** Vercel (frontend), Render (backend)

## Known Limitations

- Single workspace per user (no multi-notebook support)
- PDF files only (max 20MB per file)
- In-memory ChromaDB on Render — vector data is lost on service restart
- Citations display filename and page, not inline footnotes
- No token refresh mechanism

<p align="right"><a href="#readme-top">back to top ▲</a></p>
