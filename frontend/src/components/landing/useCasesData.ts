export type PlatformType =
  | 'chatgpt'
  | 'claude'
  | 'notion'
  | 'github'
  | 'google-drive'
  | 'perplexity'
  | 'grok'
  | 'gemini'
  | 'quello'
  | 'studio';

export type ProviderType =
  | 'notion'
  | 'google-drive'
  | 'github'
  | 'pdf';

export type MentionType =
  | 'notion'
  | 'github'
  | 'google-drive'
  | 'pdf'
  | 'quello'
  | 'studio';

export interface DocMention {
  type: MentionType;
  name: string;
}

export interface SourceItem {
  index: number;
  title: string;
  url: string;
  provider: ProviderType;
}

export interface UseCaseExample {
  id: string;
  number: string;
  title: string;
  platform: PlatformType;
  platformName: string;
  badgeText: string;
  assistantPlatform?: PlatformType;
  assistantName?: string;
  assistantBadge?: string;
  userContext?: string;
  mention?: DocMention;
  userMessage: string;
  reasoningSteps: string[];
  assistantMarkdown: string;
  sources: SourceItem[];
}

export interface UseCasesContent {
  headline: [string, string];
  examples: UseCaseExample[];
}

export const USE_CASES_DATA: UseCasesContent = {
  headline: ['Reliable results.', 'Grounded in your workspace, usable everywhere.'],
  examples: [
    {
      id: 'workspace-overview',
      number: '01',
      title: 'Full workspace overview',
      platform: 'quello',
      platformName: 'Quello',
      badgeText: 'Verified from 4 sources',
      userMessage:
        'Extract all key details from our PDFs, Notion pages, Google Drive documents, and GitHub repositories to provide a comprehensive overview of the project’s objectives, scope, and current status.',
      reasoningSteps: [
        'Scanning connected PDFs for project specifications and architecture…',
        'Querying Notion workspace for engineering roadmap and team OKRs…',
        'Retrieving Google Drive documents for updated requirements…',
        'Analyzing GitHub repositories for codebase status and API routes…',
        'Synthesizing unified project overview across all 4 knowledge sources…',
      ],
      assistantMarkdown:
        'Here is a consolidated overview synthesized across your connected sources:\n\n- **Objectives:** Bring PDFs, wikis, Drive docs, and code into one searchable workspace with exact-source citations [1][2].\n- **Connected Scope:** Ingests PDFs, syncs Notion team wikis, indexes Google Drive documents, and inspects GitHub repositories [2][3].\n- **Current Status:** FastAPI ingestion pipeline and Next.js frontend are active with Qdrant vector retrieval and MCP tool support [4].',
      sources: [
        {
          index: 1,
          title: 'Project_Architecture_Overview.pdf',
          url: 'https://docschat.app/docs/architecture',
          provider: 'pdf',
        },
        {
          index: 2,
          title: 'Engineering Roadmap & OKRs',
          url: 'https://notion.so/roadmap',
          provider: 'notion',
        },
        {
          index: 3,
          title: 'Product_Requirements_2025.gdoc',
          url: 'https://drive.google.com/product-specs',
          provider: 'google-drive',
        },
        {
          index: 4,
          title: 'docschat/core',
          url: 'https://github.com/docschat/core',
          provider: 'github',
        },
      ],
    },
    {
      id: 'spot-conflicting-information',
      number: '02',
      title: 'Spot conflicting information',
      platform: 'chatgpt',
      platformName: 'ChatGPT',
      badgeText: 'Connected via Quello MCP',
      mention: {
        type: 'quello',
        name: '@Quello',
      },
      userMessage:
        'Notion roadmap says launch is Thursday, but Drive notes say Friday — which date is current?',
      reasoningSteps: [
        'Searching connected workspace for launch date…',
        'Found Engineering Roadmap in Notion: lists Thursday launch',
        'Found Product Sync Notes in Google Drive: updated entry lists Friday',
        'Identified that Drive notes were updated this week and supersede Notion',
      ],
      assistantMarkdown:
        'I found conflicting dates across your workspace:\n\n- The [Engineering Roadmap in Notion](https://notion.so/roadmap) lists a **Thursday** launch [1].\n- The updated [Product Sync Notes in Google Drive](https://docs.google.com/product-sync) list **Friday** [2].\n\nThe Drive notes were revised this week and supersede the older Notion entry.',
      sources: [
        {
          index: 1,
          title: 'Engineering Roadmap & OKRs',
          url: 'https://notion.so/roadmap',
          provider: 'notion',
        },
        {
          index: 2,
          title: 'Product Sync Notes',
          url: 'https://docs.google.com/product-sync',
          provider: 'google-drive',
        },
      ],
    },
    {
      id: 'recap-decisions-next-steps',
      number: '03',
      title: 'Recap decisions & next steps',
      platform: 'claude',
      platformName: 'Claude',
      badgeText: 'Connected via Quello MCP',
      mention: {
        type: 'quello',
        name: '@Quello',
      },
      userMessage:
        "Summarize the key decisions and action items from yesterday's product sync.",
      reasoningSteps: [
        "Searching Google Drive and Notion for yesterday's meeting notes…",
        'Found Product Sync Notes in Google Docs: 3 decisions approved',
        'Found Sprint Backlog in Notion: 2 tasks assigned to design and engineering',
      ],
      assistantMarkdown:
        "Here are the decisions from yesterday's [Product Sync Notes](https://docs.google.com/product-sync) [1]:\n\n- **Approved:** Moving the mobile release candidate to Thursday for final checks [1].\n- **Design:** Finalize onboarding states in the [Design System page](https://notion.so/design-system) by Tuesday [2].\n- **Engineering:** Add bulk PDF upload support to the main ingestion pipeline [1].",
      sources: [
        {
          index: 1,
          title: 'Product Sync Notes',
          url: 'https://docs.google.com/product-sync',
          provider: 'google-drive',
        },
        {
          index: 2,
          title: 'Design System & Backlog',
          url: 'https://notion.so/design-system',
          provider: 'notion',
        },
      ],
    },
    {
      id: 'find-latest-file-version',
      number: '04',
      title: 'Find the latest file version',
      platform: 'perplexity',
      platformName: 'Perplexity',
      badgeText: 'Connected via Quello MCP',
      mention: {
        type: 'quello',
        name: '@Quello',
      },
      userMessage:
        'Where can I find our latest PRD and architecture spec?',
      reasoningSteps: [
        'Searching connected Google Drive and Notion files for PRD and architecture spec…',
        'Identified Product_Requirements_2025.gdoc in Google Drive updated 3 days ago',
        'Confirmed Project Architecture Overview in Notion linked from team wiki',
      ],
      assistantMarkdown:
        'The latest canonical files are:\n\n1. **[Product_Requirements_2025.gdoc](https://drive.google.com/product-specs)** in Google Drive [1] — updated 3 days ago with the current scope.\n2. **[Project Architecture Overview](https://notion.so/architecture)** in Notion [2] — the current single source of truth for system design.',
      sources: [
        {
          index: 1,
          title: 'Product_Requirements_2025.gdoc',
          url: 'https://drive.google.com/product-specs',
          provider: 'google-drive',
        },
        {
          index: 2,
          title: 'Project Architecture Overview',
          url: 'https://notion.so/architecture',
          provider: 'notion',
        },
      ],
    },
    {
      id: 'day-one-setup-guide',
      number: '05',
      title: 'Day-one setup guide',
      platform: 'grok',
      platformName: 'Grok',
      badgeText: 'Connected via Quello MCP',
      mention: {
        type: 'quello',
        name: '@Quello',
      },
      userMessage:
        'How do I get the project running locally on my laptop?',
      reasoningSteps: [
        'Reading repository README.md on GitHub…',
        'Checking Team Onboarding Guide in Notion for prerequisites',
        'Compiling 3-step startup commands',
      ],
      assistantMarkdown:
        'According to the [project README](https://github.com/docschat/core) [1] and the [Onboarding Guide](https://notion.so/onboarding) [2]:\n\n1. **Install:** Run `npm install` in frontend and `pip install -r requirements.txt` in backend.\n2. **Env:** Copy `.env.example` to `.env` and set your credentials [2].\n3. **Start:** Run `uvicorn app.main:app --reload` for API and `npm run dev` for web [1].',
      sources: [
        {
          index: 1,
          title: 'README.md',
          url: 'https://github.com/docschat/core',
          provider: 'github',
        },
        {
          index: 2,
          title: 'Team Onboarding Guide',
          url: 'https://notion.so/onboarding',
          provider: 'notion',
        },
      ],
    },
    {
      id: 'check-client-commitments',
      number: '06',
      title: 'Check access & retention',
      platform: 'gemini',
      platformName: 'Gemini',
      badgeText: 'Connected via Quello MCP',
      mention: { type: 'quello', name: '@Quello' },
      userMessage:
        'Who can access this workspace and how long is deleted data retained?',
      reasoningSteps: [
        'Checking workspace members and roles…',
        'Reading data retention policy for deleted workspaces',
        'Extracting access and retention schedule',
      ],
      assistantMarkdown:
        'Per the [workspace access controls](https://notion.so/workspace-access) [1] and the [retention policy](https://docschat.app/docs/retention) [2]:\n\n- **Access:** Workspaces stay separate with Google sign-in; roles are **owner, editor, viewer** [1].\n- **Threads:** Chats stay private per user while sources stay shared by workspace [1].\n- **Retention:** Encrypted backups age out within **30 days** of deletion [2].',
      sources: [
        {
          index: 1,
          title: 'Workspace Members & Access',
          url: 'https://notion.so/workspace-access',
          provider: 'notion',
        },
        {
          index: 2,
          title: 'Data Retention Policy',
          url: 'https://docschat.app/docs/retention',
          provider: 'pdf',
        },
      ],
    },
    {
      id: 'inspect-code-and-repos',
      number: '07',
      title: 'Inspect code and repositories',
      platform: 'github',
      platformName: 'GitHub Connector',
      badgeText: 'Synced from GitHub Repository',
      assistantPlatform: 'quello',
      assistantName: 'Quello',
      assistantBadge: 'Verified from your files',
      userContext: 'Quello via GitHub Connector',
      mention: {
        type: 'github',
        name: 'docschat-core-backend',
      },
      userMessage:
        'How does our auth middleware verify workspace access?',
      reasoningSteps: [
        'Searching docschat/core repository on GitHub…',
        'Located auth_middleware.py: validates JWT then loads user from MongoDB',
        'Checked workspace_access.py: owner, editor, viewer roles govern access',
      ],
      assistantMarkdown:
        'In the [auth_middleware.py](https://github.com/docschat/core/blob/main/backend/app/middleware/auth_middleware.py) middleware [1]:\n\n- It validates the **JWT bearer token** and loads the user from **MongoDB** [1].\n- Workspace access follows **owner, editor, viewer** roles with chats private per user [1].',
      sources: [
        {
          index: 1,
          title: 'docschat/core/middleware/auth_middleware.py',
          url: 'https://github.com/docschat/core',
          provider: 'github',
        },
      ],
    },
    {
      id: 'search-across-team-wikis',
      number: '08',
      title: 'Scope to a single file',
      platform: 'notion',
      platformName: 'Notion Connector',
      badgeText: 'Synced from Notion Workspace',
      assistantPlatform: 'quello',
      assistantName: 'Quello',
      assistantBadge: 'Verified from your files',
      userContext: 'Quello via Notion Connector',
      mention: {
        type: 'notion',
        name: 'Core Architecture Wiki',
      },
      userMessage:
        'What does it say about workspace access controls?',
      reasoningSteps: [
        'Scoping search to Core Architecture Wiki only…',
        'Ranked the access-controls section as canonical',
        'Ignored stale drafts outside the scoped file',
      ],
      assistantMarkdown:
        'Scoped to the [Core Architecture Wiki](https://notion.so/architecture) in Notion [1]:\n\nWorkspaces stay separate with Google sign-in and **owner, editor, viewer** roles [1]. Chats stay private per user while sources stay shared by workspace.',
      sources: [
        {
          index: 1,
          title: 'Core Architecture Wiki',
          url: 'https://notion.so/architecture',
          provider: 'notion',
        },
      ],
    },
    {
      id: 'find-files-in-shared-folders',
      number: '09',
      title: 'Find files in shared folders',
      platform: 'google-drive',
      platformName: 'Google Drive',
      badgeText: 'Synced from Google Drive',
      assistantPlatform: 'quello',
      assistantName: 'Quello',
      assistantBadge: 'Verified from your files',
      userContext: 'Quello via Google Drive Connector',
      mention: {
        type: 'google-drive',
        name: 'Product_Requirements_2025.gdoc',
      },
      userMessage:
        'Where is our current product requirements doc in shared folders?',
      reasoningSteps: [
        'Searching connected Google Drive team folders…',
        'Found Product_Requirements_2025 in the Product folder',
        'Confirmed document was updated this week',
      ],
      assistantMarkdown:
        'The current version is the [Product_Requirements_2025](https://drive.google.com/product-specs) located in your shared Product folder [1].\n\nIt was refreshed this week and holds the current scope [1].',
      sources: [
        {
          index: 1,
          title: 'Product_Requirements_2025.gdoc',
          url: 'https://drive.google.com/product-specs',
          provider: 'google-drive',
        },
      ],
    },
  ],
};
