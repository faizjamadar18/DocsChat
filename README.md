# NotebookLM Clone

A RAG-powered document Q&A application. Upload PDFs, ask questions, and get streaming answers grounded in your sources with citations.

## Architecture

- **Frontend:** Next.js 16 (App Router) on port 3000
- **Backend:** FastAPI on port 8000
- **Database:** MongoDB Atlas (users, sources, chat history)
- **Vector store:** ChromaDB (local, per-user collections)
- **Embeddings:** sentence-transformers (`all-MiniLM-L6-v2`)
- **LLMs:** Google Gemini 2.5 Flash (default) or Groq Llama 3.3 70B

## Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB Atlas cluster (or local MongoDB)
- [Google AI API key](https://aistudio.google.com/apikey)
- [Groq API key](https://console.groq.com/)

## Backend Setup

```bash
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Configure environment
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
# Edit .env with your MongoDB URL, JWT secret, and API keys

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

On first run, the embedding model (~90MB) downloads automatically. ChromaDB data is stored in `backend/vector_data/` and uploaded PDFs in `backend/uploads/`.

## Frontend Setup

```bash
cd frontend

npm install

# Configure environment (optional — defaults to localhost:8000)
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Smoke Test Checklist

1. Register a new account at `/register`
2. Sign in — you should see the registration success banner if coming from register
3. Upload a PDF via **Add source** in the sidebar
4. Wait for status to change from **Processing...** to **Ready · N pages**
5. Ask a question in the chat panel
6. Verify the streamed answer includes source citation chips (filename + page)
7. Click **Clear chat** to wipe history
8. Delete a source from the sidebar

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/sources` | List uploaded PDFs |
| POST | `/api/sources/upload` | Upload PDF |
| DELETE | `/api/sources/{id}` | Delete source |
| GET | `/api/chat/history` | Chat history |
| POST | `/api/chat/ask` | Ask question (SSE stream) |
| DELETE | `/api/chat/clear` | Clear chat history |

## Known Limitations

- Single workspace per user (no multi-notebook management)
- PDF files only (max 20MB)
- No token refresh or server-side auth middleware
- Citations show filename and page, not inline footnotes
