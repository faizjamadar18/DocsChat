#!/usr/bin/env bash
set -e

echo "Starting DocsChat API..."

# Run with uvicorn (gunicorn doesn't play well with FastAPI's lifespan on Windows/Render)
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 1 --timeout-keep-alive 120
