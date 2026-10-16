'use client';

export type AIDraftMode = 'append' | 'replace';

export interface PendingEditorInsert {
  html: string;
  mode: AIDraftMode;
  nonce: number;
  /** Document the insert belongs to — never apply it to another doc. */
  docId: string;
  /** Caret position captured when the draft started; null = append at end. */
  pos: number | null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineFormat(escaped: string): string {
  // `code` first so markers inside code are not treated as bold/italic.
  let out = escaped.replace(/`([^`]+?)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*\w])\*([^*\n]+?)\*/g, '$1<em>$2</em>');
  // Links: allow http(s) only; anything else renders as plain text.
  out = out.replace(
    /\[([^\]]+?)\]\(([^)]+?)\)/g,
    (_m, label: string, url: string) => {
      const safe = url.trim();
      if (/^https?:\/\/[^\s<>"']+$/i.test(safe)) {
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      }
      return label;
    },
  );
  return out;
}

/**
 * Minimal Markdown -> safe HTML for TipTap insertion.
 * Escapes raw HTML first (mirrors Markdown.tsx: no raw HTML parsing),
 * then converts headings, lists, quotes, code fences, hr, links.
 * Tables/task-lists fall back to plain paragraphs (documented limit).
 */
export function markdownToSafeHtml(markdown: string): string {
  const src = (markdown || '').replace(/\r\n/g, '\n');
  const lines = src.split('\n');
  const html: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listKind: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listKind) {
      html.push(listKind === 'ul' ? '</ul>' : '</ol>');
      listKind = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;
    if (line.trim().startsWith('```')) {
      if (!inCode) {
        closeList();
        inCode = true;
        codeBuf = [];
      } else {
        inCode = false;
        html.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }
    const h = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      closeList();
      const level = h[1].length;
      html.push(`<h${level}>${inlineFormat(escapeHtml(h[2]))}</h${level}>`);
      continue;
    }
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      closeList();
      html.push('<hr />');
      continue;
    }
    const lineBody = line.trim();
    if (lineBody.startsWith('>')) {
      closeList();
      const body = lineBody.replace(/^>\s?/, '');
      html.push(`<blockquote><p>${inlineFormat(escapeHtml(body))}</p></blockquote>`);
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      if (listKind !== 'ul') {
        closeList();
        html.push('<ul>');
        listKind = 'ul';
      }
      html.push(`<li>${inlineFormat(escapeHtml(bullet[1]))}</li>`);
      continue;
    }
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (ordered) {
      if (listKind !== 'ol') {
        closeList();
        html.push('<ol>');
        listKind = 'ol';
      }
      html.push(`<li>${inlineFormat(escapeHtml(ordered[1]))}</li>`);
      continue;
    }
    closeList();
    html.push(`<p>${inlineFormat(escapeHtml(trimmed))}</p>`);
  }
  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  }
  closeList();
  return html.join('\n');
}
