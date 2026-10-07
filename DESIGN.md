---
version: "alpha"
name: "DocsChat Ora Workspace"
description: "Light-first RAG workspace design system. Single source of truth for all AI agents (Claude Code, Cursor, Codex, Copilot, Antigravity) and human contributors. Workspace app is LIGHT-ONLY. Marketing landing is DARK-ONLY. Never mix."
colors:
  base: "#FBFBFD"
  surface: "#FFFFFF"
  sidebar: "#F7F7F9"
  card: "#FFFFFF"
  border: "#ECECEE"
  border-subtle: "#E5E7EB"
  text-primary: "#111827"
  text-secondary: "#6B7280"
  text-muted: "#9CA3AF"
  primary: "#6E56CF"
  accent: "#6E56CF"
  accent-subtle: "#EFEAFC"
  accent-hover: "#5B45B2"
  accent-soft: "#ECE8F4"
  accent-soft-hover: "#E2D9EE"
  danger: "#DC2626"
  danger-bg: "#FEF2F2"
  success: "#059669"
  user-bubble: "#83699E"
  user-bubble-hover: "#775D91"
  assistant-bubble: "#F4F4F6"
  hover-gray: "#F3F4F6"
  hover-gray-2: "#EFEFF2"
  hover-gray-3: "#F9F9FB"
typography:
  sans:
    fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "1.6"
  heading:
    fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "1.35"
  title-lg:
    fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "1.25"
  label-xs:
    fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: "1.4"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "1.5"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  dropdown:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "10px"
  dropdown-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
  dropdown-item-active:
    backgroundColor: "{colors.accent-subtle}"
    textColor: "{colors.accent-hover}"
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.text-primary}"
  button-primary:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
  input-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
  message-assistant:
    backgroundColor: "{colors.assistant-bubble}"
    textColor: "{colors.text-primary}"
  message-user:
    backgroundColor: "{colors.user-bubble}"
    textColor: "{colors.surface}"
  pill-accent:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
---

# DocsChat Design System

> **Status:** canonical · **Version:** 1.0.0 · **Owner:** frontend / design-system
> **Scope:** `frontend/src/**` · **Stack:** Next.js 16 App Router + Tailwind CSS v4 (`@theme` in `src/app/globals.css`) + React 19 + lucide-react
> **Read order for agents:** `AGENTS.md` → `DESIGN.md` (this file) → `frontend/AGENTS.md` → component source.
> Tokens in front-matter are normative. Prose explains intent. When they conflict, tokens win.

## Overview

DocsChat is a light-first, Notion-linear style RAG workspace. Two visually isolated surfaces exist:

1. **Workspace app (light-only, default):** `/home`, `/playground` (Ora), `/studio`, `/assets`, `/settings`, plus `OraSidebar`, `Sidebar`, all dropdowns, modals, inputs, and chat bubbles. Background `base #FBFBFD`, surfaces white, text near-black.
2. **Marketing landing (dark-only, exception):** `src/app/page.tsx` + `src/components/landing/*`. Background black, white/translucent text. This is intentional brand contrast, not a pattern to copy into the app.

Design principles:

- **Calm productivity over decoration.** Flat surfaces, 1px `border`, subtle shadows only for floating layers. No gradients, no glassmorphism, no glow inside the workspace (glow exists only on the dark landing).
- **One theme per surface.** Workspace never renders dark surfaces. Landing never renders light workspace tokens. A dropdown must inherit its parent surface theme.
- **Density is compact.** Body text 12–13px, labels 10–11px uppercase, generous 12–16px padding, 12–16px radii.
- **Accent is scarce.** Purple `#6E56CF` is reserved for active state, focus, and primary CTA. Everything else is grayscale.
- **Avoidances:** no dark-mode utilities in workspace code, no `zinc-*` palette, no `white/*` translucency on light backgrounds, no ad-hoc hexes for grays/purples, no inline `style={{}}` for colors.

## Colors

Source of truth is `src/app/globals.css` `@theme`. Always reference semantic tokens, never raw values in new code.

| Token | Value | Use |
|---|---|---|
| `base` | `#FBFBFD` | App page background |
| `surface` / `card` | `#FFFFFF` | Cards, inputs, dropdowns, headers |
| `sidebar` | `#F7F7F9` | Sidebar track, hover wash, mention popup hover |
| `border` | `#ECECEE` | Default 1px border |
| `border-subtle` | `#E5E7EB` | Avatar ring, muted dividers |
| `text-primary` | `#111827` | Headings, body, active icons |
| `text-secondary` | `#6B7280` | Secondary text, inactive rows |
| `text-muted` | `#9CA3AF` | Placeholders, timestamps, section labels |
| `accent` | `#6E56CF` | Active icon, links, focus |
| `accent-subtle` | `#EFEAFC` | Active row / pill background |
| `accent-hover` | `#5B45B2` | Active text hover, button hover |
| `accent-soft` | `#ECE8F4` | Citation pill, scope chip |
| `user-bubble` | `#83699E` | User chat bubble (white text) |
| `assistant-bubble` | `#F4F4F6` | Assistant message card |
| `hover-gray` | `#F3F4F6` | Generic hover wash |
| `danger` | `#DC2626` / `text-red-600` | Delete actions only |
| `danger-bg` | `red-50 #FEF2F2` | Delete hover wash |
| `success` | `emerald-600 #059669` | Copy confirmation, sync check |

Tailwind v4 mapping (already wired): `bg-base`, `bg-surface`, `bg-sidebar`, `bg-card`, `border-border`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `bg-accent`, `bg-accent-subtle`, `text-accent-hover`, etc. Do not introduce `bg-gray-*` or `text-zinc-*` aliases — use the tokens above.

Contrast: `text-primary` on `surface` ≈ 15.9:1 (AAA). `accent-hover` on `accent-subtle` ≈ 7.1:1 (AA). `accent-soft #ECE8F4` with `#765D96` text ≈ 6.4:1 (AA). `user-bubble #83699E` with white text ≈ 4.6:1 (AA pass for body).

## Typography

Font: Geist (via `geist` package) with Inter/system fallback. No custom webfonts without updating this file.

| Role | Size / Weight | Tailwind | Usage |
|---|---|---|---|
| App title / greeting | 30–36px / 700 tracking-tight | `text-3xl sm:text-4xl font-bold tracking-tight text-text-primary` | Playground hero, Studio H1 input |
| Section heading | 14px / 600 | `text-sm font-semibold text-text-primary` | Sidebar headers, empty-state titles |
| Body | 13px / 400 leading-relaxed | `text-[13px] leading-relaxed` | Messages, rows |
| Row text | 12px / 400–500 | `text-xs` | Nav items, dropdown rows |
| Micro label | 10–11px / 600 uppercase tracking-wider | `text-[10px] font-semibold uppercase tracking-wider text-text-muted` | `TODAY`, `OLDER`, `STUDIO DOCUMENTS` |
| Timestamp | 10px / 400 muted | `text-[10px] text-text-muted` | Relative time (`5m`, `2h`, `yesterday`) |
| Mono / kbd | 10–11px mono | `font-mono text-[10px] bg-[#EFEFF2] px-1.5 rounded` | `⌘.`, `Ctrl+K`, `@` hint |

Rules: truncate titles with `truncate`; subtitles with `line-clamp-2/3`; never shrink below 10px; tooltips max 10–11px white on `bg-text-primary`.

## Layout

Workspace shell: `AppLayout` → fixed left `Sidebar` (256px, `bg-sidebar`, collapsible via `-ml-64`) + fluid content column + optional right `OraSidebar` (320–384px, `bg-white`, `border-l`).

- Header bars are 44–56px (`h-11` Studio sub-bar, `h-14` Ora/Sidebar/Playground), `bg-white` (or `bg-surface`), `border-b border-border`, `px-4/6`.
- Content gutters: `px-6 py-8`, max reading width `max-w-3xl` centered for editor/chat, `max-w-2xl` for hero.
- Dropdown anchoring: absolutely positioned to trigger (`absolute top-14 left-3 right-3` for Ora history; `absolute right-0 top-full mt-1.5` for row menus; `absolute bottom-full` for mention autocomplete). Parent must be `relative`. Close on outside-click + `Escape`.
- Scroll regions: dropdown list `max-h-56/96 overflow-y-auto`; chat column `flex-1 overflow-y-auto`; thin 6px global scrollbar (`globals.css`).
- Responsive: `sm:` breakpoint for padding/type only. Sidebar collapses to drawer on `<lg` with `bg-black/30` scrim (scrim is the only black overlay allowed in workspace). Studio left docs column collapses via `PanelLeft` toggle; Ora right column collapses via width/opacity transition, never `display:none` mid-animation.
- Z-scale: content `z-10`, dropdown/menu `z-30–50`, modal scrim `z-50`, toast `z-50`.

## Elevation & Depth

Flat-first. Shadows mark float only:

| Level | Token | Usage |
|---|---|---|
| `0` — flat | `border border-border`, no shadow | Rows, cards at rest, inputs at rest |
| `1` — raised | `shadow-2xs` (`0 1px 2px rgb(0 0 0 / 0.04)`) | Selected asset row, active filter pill, scope chip |
| `2` — floating | `shadow-xl` | All dropdowns, mention autocomplete, modals |
| `3` — overlay | `shadow-xl + backdrop-blur + bg-black/30|40 scrim` | Mobile drawer, `UploadModal`, delete confirm |

Rules: dropdowns always `bg-white rounded-2xl border border-border shadow-xl p-2/2.5 animate-fade-in`. Never `shadow-2xl` + dark fill in workspace. Focus rings: `focus-within:ring-2 focus-within:ring-text-primary/10 focus-within:border-text-primary/40` on input cards only. Entry animation is `fadeIn` (opacity + 6px translate, 0.2s) via `.animate-fade-in`.

## Shapes

Radius scale: `sm 8px` (icon buttons, kbd), `md 12px` (nav rows `rounded-lg`, row menus `rounded-xl`), `lg 16px` (message bubbles `rounded-2xl`, dropdowns `rounded-2xl`), `xl 24px` (hero input `rounded-3xl`), `full` (pills, avatars, send buttons `rounded-full`).

Icon buttons are square `p-1/1.5 rounded-lg` with `text-text-muted hover:text-text-primary hover:bg-[#F3F4F6]`. Pills are `px-2.5 py-1 rounded-full text-[11px] font-medium`. Message bubbles: user `rounded-2xl px-4 py-3`, assistant card `rounded-2xl p-4/5`. Keep one radius per component — do not mix `rounded-lg` rows inside a `rounded-2xl` menu with `rounded-md` children.

## Components

All workspace components below are light-only. Copy these class recipes verbatim. Landing dark variants are out of scope.

### 1. Dropdown / menu (canonical — fixes 2026-10-07 incident)

```tsx
<div className="absolute bg-white text-text-primary rounded-2xl shadow-xl border border-border p-2.5 z-50 animate-fade-in">
  <div className="text-[10px] font-semibold text-text-muted px-2 py-1 uppercase tracking-wider">Today</div>
  <div className="group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer text-text-secondary hover:bg-sidebar hover:text-text-primary">
    {/* active: bg-accent-subtle text-accent-hover font-medium */}
  </div>
</div>
```

Reference implementation: `OraSidebar.tsx` (history), `assets/page.tsx` (row menu `w-36`), `Sidebar.tsx` (user menu), `playground/page.tsx` (mention autocomplete). Container is always white; rows grayscale; active row accent-subtle/accent-hover; delete `hover:text-red-600`; timestamps `text-text-muted`.

### 2. Sidebar (`Sidebar.tsx`, `OraSidebar.tsx`, `StudioDocumentsSidebar`)

Left nav `w-64 bg-sidebar border-r`; right assistant `w-80 sm:w-96 bg-white border-l`. Nav row: `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-[#EFEFF2]`; active adds `bg-accent-subtle text-accent-hover`. Section toggle (`CHATS`): `text-[11px] font-semibold uppercase tracking-wider text-text-muted`.

### 3. Buttons

- Primary dark: `bg-[#111113] hover:bg-black text-white rounded-xl text-xs font-medium px-4 py-2` (Upload).
- Send/stop circle: `w-7/8 h-7/8 rounded-full bg-text-primary text-white hover:bg-black disabled:opacity-25`.
- Ghost icon: `p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6]`.
- Accent text button: `bg-accent/10 text-accent border border-accent/20 rounded-xl` (Ora toggle active).
- Danger row: `text-red-600 hover:text-red-700 hover:bg-red-50`.

### 4. Inputs

Hero/conversation card: `bg-white border border-border rounded-3xl/2xl p-4/3 shadow-sm focus-within:ring-2 focus-within:ring-text-primary/10`. Textarea/input itself: `bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none resize-none`. Inline search: `bg-sidebar border border-border rounded-xl px-3 py-2 text-xs`. Scope chip above input: `bg-[#ECE8F4] text-[#765D96] px-2.5 py-1 rounded-full text-xs font-medium`.

### 5. Chat messages

User: `max-w-[85%] rounded-2xl px-4 py-3 bg-[#83699e] text-white`; attached pill inside: `bg-white/20 text-white`. Assistant: `rounded-2xl p-4/5 bg-[#F4F4F6] text-text-primary border border-border/40`; status pill: `bg-[#ECE8F4] text-[#765D96] rounded-full text-[11px]`; citations drawer: `bg-white rounded-xl border p-2.5/3`. Thinking state: `text-[13px] text-text-muted animate-pulse`.

### 6. Modal / toast / tooltip

Scrim `fixed inset-0 bg-black/40 backdrop-blur-xs`; panel `bg-white rounded-2xl border shadow-xl`; toast `fixed bottom-8 bg-white/95 backdrop-blur border rounded-2xl shadow-xl text-xs`; tooltip `bg-text-primary text-white text-[10px] px-2 py-1 rounded-md shadow-md`.

## Do's and Don'ts

**Do:**

- Do use `bg-white text-text-primary border-border shadow-xl` for every workspace dropdown.
- Do use `bg-sidebar` / `hover:bg-[#EFEFF2]` for hover wash and `bg-accent-subtle text-accent-hover` for selected row.
- Do use `text-text-muted` for labels/timestamps and `hover:text-red-600 hover:bg-red-50` for delete.
- Do anchor floating layers relative to their trigger, cap height, and wire outside-click + `Escape` to close.
- Do keep landing dark styles inside `src/app/page.tsx` + `src/components/landing/*` only.
- Do add new colors as `@theme` tokens in `globals.css` and register them here before use.

**Don't:**

- Don't use `bg-[#1e1e20]`, `bg-black`, `bg-zinc-*`, `text-zinc-*`, `text-white`, `border-white/*`, or `bg-white/*` translucency anywhere under `src/app/(workspace)`, `src/components/layout/OraSidebar*`, `src/components/layout/Sidebar*`, `src/components/studio/*`, `src/components/assets/*`.
- Don't copy landing (`bg-black text-white/60`) or legacy (`ChatPanel`, `ChatMessage`, `ModelSwitcher`, `UploadArea`, `SourcesSidebar` — deprecated dark, do not reuse) styles into workspace code.
- Don't hardcode gray/purple hexes (`#F3F4F6`, `#ECE8F4`, `#83699e`) in new code — use the token class (`hover:bg-sidebar`, `bg-accent-soft`, `bg-user-bubble` once added; existing hardcoded instances are grandfathered).
- Don't put two primary CTAs in one dialog, don't use toasts for errors requiring action, don't nest dropdowns.
- Don't add `dark:` variants — this system has no dark mode. Theming is per-surface, not per-preference.

> Incident record 2026-10-07: `OraSidebar` chat-history dropdown shipped with `bg-[#1e1e20] text-zinc-100 … border-white/10` (Notion-dark copy) inside Assets + Studio sidebars, breaking light-mode consistency. Root cause: copying an external dark reference without mapping to tokens. Fix: converted to canonical light dropdown (`OraSidebar.tsx`) and codified this section + the agent lint below so it cannot regress.

---

## Appendix A — Agent Enforcement Contract (must-follow for Claude / Cursor / Codex / Copilot)

1. **Read this file before touching `frontend/src`.** Tokens first, then the Components recipe for what you are building.
2. **Theme gate:** if the file path contains `(workspace)`, `OraSidebar`, `Sidebar`, `studio`, `assets`, or `playground`, reject any surface-level class matching `bg-[#1e1e20]`, `bg-black` (except scrim `bg-black/30|40`), `text-zinc-*`, `bg-zinc-*`, `border-white/*`, `bg-white/*` translucency, or `dark:`. Allowed exceptions: `text-white` / `border-white/*` / `border-t-white` **only** inside solid dark controls (`bg-[#111113]`, `bg-black`, `bg-text-primary`, `bg-red-600`, `bg-[#83699e]`) for labels, icons, and spinners — e.g. `DeleteConfirmationModal` spinner.
3. **Token gate:** new color/spacing/radius must come from front-matter or `globals.css @theme`. Raw hex/opacity outside the allow-list (`#111113`, `#83699e`, `#ECE8F4`, `#765D96`, scrim `bg-black/30|40`) requires updating both files in the same commit.
4. **Component gate:** new dropdown/menu/modal/tooltip must start by copying the §Components recipe, not by inventing classes. Reuse `Sidebar`, `OraSidebar`, `UploadModal`, `DeleteConfirmationModal` — do not re-implement.
5. **Verification gate (per `AGENTS.md` — never ask the user to QA):** after a UI change run `npx tsc --noEmit` in `frontend/` and a `grep` for banned classes in the touched scope; attach the result in the commit/PR description. Visual check via `npm run dev` + screenshot diff when touching floating layers.
6. **Landing isolation:** dark classes are allowed only in `src/app/page.tsx` and `src/components/landing/*`. Any PR touching those plus workspace files must call out both surfaces separately.

Pre-commit quick-lint (PowerShell):

```powershell
rg -n "bg-\[#1e1e20\]|text-zinc-|bg-zinc-|border-white/|dark:" frontend/src/app/\(workspace\) frontend/src/components/layout frontend/src/components/studio frontend/src/components/assets
```

Empty output = pass. Non-empty = fail the commit.

## Appendix B — File Map

| Concern | Path |
|---|---|
| Tokens | `frontend/src/app/globals.css` (`@theme`), this file front-matter |
| Workspace shell | `frontend/src/components/layout/AppLayout.tsx`, `(workspace)/layout.tsx` |
| Left nav + user menu | `frontend/src/components/layout/Sidebar.tsx` |
| Right assistant + history dropdown | `frontend/src/components/layout/OraSidebar.tsx` (+ `OraSidebarDrawer.tsx` re-export) |
| Playground hero + stream + mentions | `frontend/src/app/(workspace)/playground/page.tsx` |
| Assets table + row menu | `frontend/src/app/(workspace)/assets/page.tsx` |
| Studio editor + docs sidebar | `frontend/src/app/(workspace)/studio/page.tsx`, `src/components/studio/*` |
| Modals | `src/components/assets/UploadModal.tsx`, `DeleteConfirmationModal.tsx`, `UploadBanner.tsx` |
| Legacy dark (deprecated, do not copy) | `src/components/ChatPanel.tsx`, `ChatMessage.tsx`, `ModelSwitcher.tsx`, `UploadArea.tsx`, `SourcesSidebar.tsx` |
| Dark landing (isolated) | `src/app/page.tsx`, `src/components/landing/*` |

## Appendix C — Changelog

- `1.0.0` (2026-10-07): initial canonical spec. Extracted live tokens from `globals.css`; codified light-only workspace + dark-only landing; fixed Ora history dropdown dark violation; added agent lint gates. Format follows Google `design.md` spec (YAML front-matter + ordered `##` sections) and W3C DTCG token naming so `export --format css-tailwind|dtcg` tooling and Claude/Cursor/Codex agents can consume it directly.
