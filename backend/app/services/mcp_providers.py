"""Provider catalog for the MCP Server tab (single source of truth).

The tab supports many AI apps (Claude, Grok, ChatGPT, ...) that all
talk to the SAME generic endpoint and tools. The only thing that
differs per app is display copy + setup steps + status, which lives
here. Adding provider #10 = one dict entry + one frontend icon.
Served publicly via GET /api/mcp/providers (no secrets in here).

Reusable contract (backend generic, per-brand data only):
- Transport/auth on the server NEVER branches per provider.
  /mcp (Streamable HTTP) + discovery + DCR + CIMD + PKCE + personal-key
  Bearer fallback works for every brand below.
- Per-brand differences (UI strings, plan gates, redirect URLs, doc
  links) live ONLY in this catalog. Frontend renders generically.
- To launch a "soon" provider: fill steps, set status to "ready",
  keep redirect_uris/auth_modes accurate. No route changes needed.

Field guide:
- docs_url: official brand docs for THEIR connector UI ("" if none found).
- redirect_uris: exact OAuth callbacks the brand uses; [] = key/none only.
  Templates use {...} placeholders (e.g. ChatGPT per-connector callback id).
- auth_modes: subset of ["oauth_dcr", "oauth_cimd", "oauth_static",
  "oauth", "api_key", "custom_connector", "none"].
"""
import copy

# status: "ready" (Connect works) or "soon" (drawer shows notice).
PROVIDERS: list[dict] = [
    {
        "id": "claude",
        "name": "Claude",
        "tagline": "Answer from your docs inside Claude",
        "about": (
            "Connect Claude to your Quello workspace so it can "
            "search your PDFs, Studio documents and connected "
            "sources, then answer with source names and page "
            "numbers. Read-only — Claude can never edit anything."
        ),
        "needs": [
            "At least one document or PDF in your workspace",
            "A Claude account",
        ],
        "steps": [
            "In Claude, open Settings, then Connectors.",
            "Click Add custom connector and paste the URL.",
            "Click Add, then Connect, sign in when asked.",
            "Ask Claude about your documents to test it.",
        ],
        "status": "ready",
        "auth_note": (
            "Claude signs in with Quello once when added. If "
            "sign-in is not offered, create a personal key in "
            "this panel and add it as an Authorization header."
        ),
        "requires_key": True,
        "docs_url": "https://claude.com/docs/connectors/building/authentication",
        "redirect_uris": [
            "https://claude.ai/api/mcp/auth_callback",
            "http://localhost/callback",
            "http://127.0.0.1/callback",
        ],
        "auth_modes": ["oauth_dcr", "oauth_cimd", "api_key"],
    },
    {
        "id": "grok",
        "name": "Grok",
        "tagline": "Answer from your docs inside Grok",
        "about": (
            "Connect Grok to your Quello workspace so it can "
            "search your PDFs, Studio documents and connected "
            "sources, then answer with source names and page "
            "numbers. Read-only — Grok can never edit anything."
        ),
        "needs": [
            "At least one document or PDF in your workspace",
            "A personal key created in this panel",
        ],
        "steps": [
            "Go to grok.com/connectors, New Connector, Custom.",
            "Paste your server URL.",
            "Paste your personal key when asked for auth.",
            "Ask Grok about your documents to test it.",
        ],
        "status": "ready",
        "auth_note": (
            "Grok authenticates with a personal key. Create "
            "one in this panel and paste it as the token."
        ),
        "requires_key": True,
        "docs_url": "https://docs.x.ai/grok/connector-management",
        "redirect_uris": [],
        "auth_modes": ["api_key", "oauth"],
    },
    {
        "id": "chatgpt",
        "name": "ChatGPT",
        "tagline": "Use your workspace as a ChatGPT tool",
        "about": (
            "ChatGPT will use your Quello workspace as a tool "
            "— searching PDFs and Studio documents, answering "
            "with citations, like Claude does today. Read-only."
        ),
        "needs": ["At least one document or PDF in your workspace"],
        "steps": [],
        "status": "soon",
        "auth_note": "",
        "requires_key": False,
        "docs_url": "https://learn.chatgpt.com/apps-sdk/build/auth",
        "redirect_uris": [
            "https://chatgpt.com/connector/oauth/{callback_id}",
        ],
        "auth_modes": ["oauth_dcr", "oauth_cimd"],
    },
    {
        "id": "cursor",
        "name": "Cursor",
        "tagline": "Pull workspace answers into your editor",
        "about": (
            "Cursor will consult your Quello workspace inside "
            "the editor — grounding code answers in your PDFs, "
            "specs and Studio documents. Read-only, as always."
        ),
        "needs": [
            "Cursor installed on your machine",
            "Your server URL, shown here at launch",
        ],
        "steps": [],
        "status": "soon",
        "auth_note": "",
        "requires_key": False,
        "docs_url": "https://cursor.com/docs/mcp",
        "redirect_uris": [
            "https://www.cursor.com/agents/mcp/oauth/callback",
            "http://localhost:8787/callback",
        ],
        "auth_modes": ["oauth_dcr", "oauth_static", "api_key"],
    },
    {
        "id": "perplexity",
        "name": "Perplexity",
        "tagline": "Research over your own documents",
        "about": (
            "Perplexity will research across your Quello "
            "workspace alongside web search — answering from "
            "your PDFs and Studio documents. Read-only."
        ),
        "needs": ["At least one document or PDF in your workspace"],
        "steps": [],
        "status": "soon",
        "auth_note": "",
        "requires_key": False,
        "docs_url": "https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors",
        "redirect_uris": [
            "https://www.perplexity.ai/rest/connections/oauth_callback",
        ],
        "auth_modes": ["oauth", "api_key", "none"],
    },
    {
        "id": "mistral",
        "name": "Mistral",
        "tagline": "Ask Le Chat about your workspace",
        "about": (
            "Mistral Le Chat will answer from your Quello "
            "workspace — searching PDFs and Studio documents "
            "with citations. Read-only, as always."
        ),
        "needs": ["At least one document or PDF in your workspace"],
        "steps": [],
        "status": "soon",
        "auth_note": "",
        "requires_key": False,
        "docs_url": "https://docs.mistral.ai/vibe/work/connectors/mcp-connectors",
        "redirect_uris": [],
        "auth_modes": ["oauth", "api_key"],
    },
    {
        "id": "gemini",
        "name": "Gemini",
        "tagline": "Ground Gemini in your documents",
        "about": (
            "Gemini will consult your Quello workspace before "
            "answering — grounding responses in your PDFs and "
            "Studio documents. Read-only, as always."
        ),
        "needs": ["At least one document or PDF in your workspace"],
        "steps": [],
        "status": "soon",
        "auth_note": "",
        "requires_key": False,
        "docs_url": "https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server",
        "redirect_uris": [],
        "auth_modes": ["oauth"],
    },
    {
        "id": "copilot",
        "name": "Microsoft Copilot",
        "tagline": "Bring your workspace into Copilot",
        "about": (
            "Microsoft Copilot will search your Quello "
            "workspace — retrieving PDFs, Studio documents and "
            "sources to answer with citations. Read-only."
        ),
        "needs": ["At least one document or PDF in your workspace"],
        "steps": [],
        "status": "soon",
        "auth_note": "",
        "requires_key": False,
        "docs_url": "https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent",
        "redirect_uris": [],
        "auth_modes": ["oauth", "custom_connector"],
    },
    {
        "id": "manus",
        "name": "Manus",
        "tagline": "Let your AI agent work from your docs",
        "about": (
            "Manus AI will read and analyze your Quello "
            "workspace — multi-step research grounded in your "
            "documents and notes. Read-only, as always."
        ),
        "needs": [
            "A Manus account with connector support",
            "At least one document or PDF in your workspace",
        ],
        "steps": [],
        "status": "soon",
        "auth_note": "",
        "requires_key": False,
        "docs_url": "",
        "redirect_uris": [],
        "auth_modes": ["api_key"],
    },
]


def get_providers() -> list[dict]:
    """Return the catalog (copies, so callers can't mutate it)."""
    return copy.deepcopy(PROVIDERS)
