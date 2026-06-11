<a id="readme-top"></a>

<br/>
<div align="center">
  <h1 align="center">DocsChat</h1>
  <p align="center">
    AI-powered document Q&A — upload PDFs, ask questions, get grounded answers with citations.
    <br/>
    Built with FastAPI + Next.js 16.
    <br/><br/>
    <a href="#-features">Features</a>
    ·
    <a href="#-architecture">Architecture</a>
    ·
    <a href="#-getting-started">Getting Started</a>
    ·
    <a href="#-deployment">Deployment</a>
    ·
    <a href="#-api">API</a>
  </p>
</div>

<br/>

## ✦ Features

- **RAG-powered answers** — ask natural-language questions against your uploaded documents
- **Multi-model LLM support** — Google Gemini 2.5 Flash (default) or Groq Llama 3.3 70B
- **Source-grounded citations** — every answer links back to the exact filename and page
- **Streaming responses** — see answers token-by-token as they're generated
- **Persistent workspaces** — per-user auth, file storage, and chat history via MongoDB
- **Mobile-responsive dashboard** — sidebar drawer, adaptive layout

## ✦ Architecture

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Next.js 16  │────▶│    FastAPI       │────▶│  MongoDB     │
│  (Vercel)    │◀────│  (Render)        │     │  Atlas       │
└──────────────┘     └───────┬─────────┘     └──────────────┘
                             │
                    ┌────────▼────────┐
                    │  ChromaDB       │
                    │  (vector store) │
                    │  + sentence-    │
                    │  transformers   │
                    └─────────────────┘
```

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4 | Vercel |
| Backend | FastAPI, Python 3.11+ | Render |
| Database | MongoDB Atlas (users, sources, messages) | MongoDB Atlas |
| Vector store | ChromaDB (in-memory on Render, persistent locally) | — |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) | — |
| LLMs | Google Gemini 2.5 Flash / Groq Llama 3.3 70B | — |

## ✦ Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB Atlas cluster (or local MongoDB)
- [Google AI API key](https://aistudio.google.com/apikey)
- [Groq API key](https://console.groq.com/)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows: .\venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env   # then edit .env with your keys

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The embedding model (~90MB) downloads automatically on first run. ChromaDB data lives in `backend/vector_data/`; uploaded PDFs in `backend/uploads/`.

### Frontend

```bash
cd frontend

npm install

# Optional — defaults to proxying localhost:8000
cp .env.example .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## ✦ Deployment

### Render (Backend)

1. Create a new **Web Service** on Render and point it at the `backend/` directory.
2. Set the build command: `pip install -r requirements.txt`
3. Set the start command: `bash start.sh`
4. Add the following environment variables in the Render dashboard:

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URL` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Generate a strong random secret |
| `GEMINI_API_KEY` | Yes | Google AI Studio key |
| `GROQ_API_KEY` | Yes | Groq console key |
| `CORS_ORIGINS` | Yes | Comma-separated frontend URLs |
| `CHROMA_PERSISTENT` | Yes | Set to `false` on Render |
| `DB_NAME` | No | Defaults to `notebuddy` |

An alternative `render.yaml` blueprint is included in `backend/` for one-click setup.

### Vercel (Frontend)

1. Import the `frontend/` directory as a new Vercel project.
2. Add the environment variable:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-render-app.onrender.com` |

3. Deploy. No additional configuration needed.

## ✦ API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Get JWT token |
| `GET` | `/api/auth/me` | Current user profile |
| `GET` | `/api/sources` | List uploaded PDFs |
| `POST` | `/api/sources/upload` | Upload PDF |
| `DELETE` | `/api/sources/{id}` | Delete source |
| `GET` | `/api/chat/history` | Chat history |
| `POST` | `/api/chat/ask` | Ask question (SSE stream) |
| `DELETE` | `/api/chat/clear` | Clear chat history |

## ✦ Smoke Test

1. Register at `/register`
2. Sign in at `/login`
3. Upload a PDF via **Add source** in the sidebar
4. Wait for status: `Processing...` → `Ready · N pages`
5. Ask a question in the chat panel
6. Verify streamed answer includes source citation chips
7. **Clear chat** to wipe history
8. Delete a source from the sidebar

## ✦ Known Limitations

- Single workspace per user (no multi-notebook management)
- PDF files only (max 20MB)
- No token refresh or server-side auth middleware
- Citations show filename and page, not inline footnotes
- In-memory ChromaDB on Render means vector data is lost on restart

<p align="right"><a href="#readme-top">back to top ▲</a></p>
