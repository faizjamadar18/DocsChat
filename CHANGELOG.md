# Changelog

All notable changes to Quello are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Repository hygiene: removed dead landing components and duplicate icon
  dependencies, dropped unused `gunicorn`, renamed default `DB_NAME` to `quello`.
- Docs: rewrote README for the current stack (Qdrant, Google OAuth,
  multi-workspace), added MIT license, contributing guide, and CI.

## Recent Highlights

- **Team workspaces** — shared rooms with roles, member management, and email invites.
- **Connectors** — import knowledge from Notion, Google Drive, and GitHub (OAuth, read-only, resync).
- **Studio editor** — rich-text documents with AI refactor and vector indexing.
- **Voice agent** — Vapi-powered voice sessions with per-user encrypted keys and call logs.
- **MCP server** — Streamable HTTP endpoint with per-user API keys and OAuth discovery.
- **Cold-start softening** — instant `/health` liveness probe plus landing-page backend warm-up for Render free tier.
- **Storage** — Cloudflare R2 object storage with local fallback.
