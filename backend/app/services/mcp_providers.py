"""Provider catalog for the MCP Server tab (single source of truth).

The tab supports many AI apps (Claude, Grok, ChatGPT, ...) that all
talk to the SAME generic endpoint and tools. The only thing that
differs per app is display copy + setup steps + status, which lives
here. Adding provider #10 = one dict entry + one frontend icon.
Served publicly via GET /api/mcp/providers (no secrets in here).
"""
import copy

# status: "ready" (Connect works) or "soon" (drawer shows notice).
PROVIDERS: list[dict] = [
    {
        "id": "claude",
        "name": "Claude",
        "tagline": "Answer from your docs inside Claude",
        "about": (
            "Connect Claude to your DocsChat workspace so it can "
            "search your PDFs, Studio documents and connected "
            "sources, then answer with source names and page "
            "numbers. Read-only — Claude can never edit anything."
        ),
        "needs": [
            "At least one document or PDF in your workspace",
            "A Claude account (free plan works — one connector)",
        ],
        "steps": [
            "In Claude, open Settings, then Connectors.",
            "Click Add custom connector and paste the URL.",
            "Click Add, then Connect, sign in when asked.",
            "Ask Claude about your documents to test it.",
        ],
        "status": "ready",
        "auth_note": (
            "Claude signs in with DocsChat once when added. If "
            "sign-in is not offered, create a personal key in "
            "this panel and add it as an Authorization header."
        ),
        "requires_key": True,
    },
    {
        "id": "grok",
        "name": "Grok",
        "tagline": "Answer from your docs inside Grok",
        "about": (
            "Connect Grok to your DocsChat workspace so it can "
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
        "paid_note": (
            "Free Grok accounts can add custom connectors "
            "within usage limits. Heavy use may need paid."
        ),
        "auth_note": (
            "Grok authenticates with a personal key. Create "
            "one in this panel and paste it as the token."
        ),
        "requires_key": True,
    },
    {
        "id": "chatgpt",
        "name": "ChatGPT",
        "tagline": "Use your workspace as a ChatGPT tool",
        "about": (
            "ChatGPT will use your DocsChat workspace as a tool "
            "— searching PDFs and Studio documents, answering "
            "with citations, like Claude does today. Read-only."
        ),
        "needs": [
            "A paid ChatGPT plan (Plus or higher)",
            "At least one document or PDF in your workspace",
        ],
        "steps": [],
        "status": "soon",
        "paid_note": (
            "Custom connectors in ChatGPT need a paid plan "
            "(Plus or higher) on your side."
        ),
        "auth_note": "",
        "requires_key": False,
    },
    {
        "id": "cursor",
        "name": "Cursor",
        "tagline": "Pull workspace answers into your editor",
        "about": (
            "Cursor will consult your DocsChat workspace inside "
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
    },
    {
        "id": "perplexity",
        "name": "Perplexity",
        "tagline": "Research over your own documents",
        "about": (
            "Perplexity will research across your DocsChat "
            "workspace alongside web search — answering from "
            "your PDFs and Studio documents. Read-only."
        ),
        "needs": [
            "A paid Perplexity plan (Pro or higher)",
            "At least one document or PDF in your workspace",
        ],
        "steps": [],
        "status": "soon",
        "paid_note": (
            "Custom connectors in Perplexity need a paid plan "
            "(Pro or higher) on your side."
        ),
        "auth_note": "",
        "requires_key": False,
    },
    {
        "id": "mistral",
        "name": "Mistral",
        "tagline": "Ask Le Chat about your workspace",
        "about": (
            "Mistral Le Chat will answer from your DocsChat "
            "workspace — searching PDFs and Studio documents "
            "with citations. Read-only, as always."
        ),
        "needs": ["At least one document or PDF in your workspace"],
        "steps": [],
        "status": "soon",
        "auth_note": "",
        "requires_key": False,
    },
    {
        "id": "gemini",
        "name": "Gemini",
        "tagline": "Ground Gemini in your documents",
        "about": (
            "Gemini will consult your DocsChat workspace before "
            "answering — grounding responses in your PDFs and "
            "Studio documents. Read-only, as always."
        ),
        "needs": ["At least one document or PDF in your workspace"],
        "steps": [],
        "status": "soon",
        "auth_note": "",
        "requires_key": False,
    },
    {
        "id": "copilot",
        "name": "Microsoft Copilot",
        "tagline": "Bring your workspace into Copilot",
        "about": (
            "Microsoft Copilot will search your DocsChat "
            "workspace — retrieving PDFs, Studio documents and "
            "sources to answer with citations. Read-only."
        ),
        "needs": [
            "A Microsoft Copilot license on your side",
            "At least one document or PDF in your workspace",
        ],
        "steps": [],
        "status": "soon",
        "paid_note": (
            "Custom MCP connectors in Copilot may need an "
            "active Microsoft 365 Copilot license."
        ),
        "auth_note": "",
        "requires_key": False,
    },
    {
        "id": "manus",
        "name": "Manus",
        "tagline": "Let your AI agent work from your docs",
        "about": (
            "Manus AI will read and analyze your DocsChat "
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
    },
]


def get_providers() -> list[dict]:
    """Return the catalog (copies, so callers can't mutate it)."""
    return copy.deepcopy(PROVIDERS)
