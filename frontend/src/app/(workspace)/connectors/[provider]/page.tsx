'use client';
import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, Trash2, ExternalLink, X } from 'lucide-react';
import { useConnectors, type NotionPage, type DriveFile, type GitHubRepo } from '@/hooks/useConnectors';
import { NotionIcon, GoogleDriveIcon, GitHubIcon } from '@/components/connectors/ConnectorIcons';
import { StatusPill, isSyncing } from '@/components/connectors/StatusPill';

const PICKER_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const PICKER_APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID || '';

type PickerWindow = Window & {
  gapi?: { load: (mod: string, cb: () => void) => void };
  google?: { picker?: unknown };
};

interface PickerBuilderLike {
  addView: (v: unknown) => PickerBuilderLike;
  setOAuthToken: (t: string) => PickerBuilderLike;
  setDeveloperKey: (k: string) => PickerBuilderLike;
  setAppId: (id: string) => PickerBuilderLike;
  enableFeature: (f: unknown) => PickerBuilderLike;
  setCallback: (cb: (d: { action: string; docs?: DriveFile[] }) => void) => PickerBuilderLike;
  build: () => { setVisible: (v: boolean) => void };
}

let pickerJsLoading: Promise<void> | null = null;
function loadPickerJs(): Promise<void> {
  if (typeof window !== 'undefined' && (window as PickerWindow).google?.picker) {
    return Promise.resolve();
  }
  if (!pickerJsLoading) {
    pickerJsLoading = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      const onload = () => {
        try {
          (window as PickerWindow).gapi?.load('picker', () => resolve());
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Picker failed to load'));
        }
      };
      if (existing) {
        onload();
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://apis.google.com/js/api.js';
      s.async = true;
      s.defer = true;
      s.onload = onload;
      s.onerror = () => reject(new Error('Picker failed to load'));
      document.head.appendChild(s);
    });
  }
  return pickerJsLoading;
}

function timeAgo(iso?: string | null): string {
  if (!iso) return 'never';
  const clean = iso.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const mins = Math.max(0, Math.floor((Date.now() - new Date(clean).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PROVIDERS: Record<string, { name: string; desc: string; icon: React.ReactNode }> = {
  notion: {
    name: 'Notion',
    desc: 'Import pages you shared with DocsChat as sources for Q&A and voice.',
    icon: <NotionIcon className="w-8 h-8" />,
  },
  drive: {
    name: 'Google Drive',
    desc: 'Import Docs and PDFs from Drive as sources for Q&A and voice.',
    icon: <GoogleDriveIcon className="w-8 h-8" />,
  },
  github: {
    name: 'GitHub',
    desc: 'Import READMEs and docs from repos as sources for Q&A and voice.',
    icon: <GitHubIcon className="w-8 h-8" />,
  },
};

export default function ConnectorDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const provider = (params.provider as string) || '';
  const meta = PROVIDERS[provider];

  const {
    status, sources, loading, error, refresh,
    connectNotion, listNotionPages, importNotionPages,
    connectDrive, getPickerToken, importDriveFiles,
    connectGithub, listGithubRepos, importGithubRepos,
    resyncSource, disconnectProvider, deleteSource,
  } = useConnectors();

  const [showImport, setShowImport] = useState(false);
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, NotionPage>>({});
  const [busy, setBusy] = useState(false);
  // OAuth callbacks land here with a full page load (?notion=connected ...),
  // so the landing params are captured once as initial state — no effect needed.
  const [notice, setNotice] = useState<string | null>(() => {
    const flag = searchParams.get('notion');
    const dflag = searchParams.get('drive');
    const gflag = searchParams.get('github');
    if (gflag === 'connected') return 'GitHub connected. Pick repos to import.';
    if (gflag === 'error') return 'GitHub connection failed. Try again.';
    if (dflag === 'connected') return 'Google Drive connected. Choose files to import.';
    if (dflag === 'reconsent') return 'Drive needs one more consent to stay synced. Disconnect and connect again.';
    if (dflag === 'error') return 'Google Drive connection failed. Try again.';
    if (flag === 'connected') return 'Notion connected. Pick pages to import.';
    if (flag === 'error') return 'Notion connection failed. Try again.';
    return null;
  });
  const [deleteOnDisconnect, setDeleteOnDisconnect] = useState(true);
  const [showRepos, setShowRepos] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<Record<string, GitHubRepo>>({});
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!showImport && !showRepos) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowImport(false);
        setShowRepos(false);
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [showImport, showRepos]);

  // Auto-refresh while anything is syncing, so the status/chunks
  // always settle to the truth without a manual page reload.
  const hasActive = sources.some((s) => isSyncing(s.status));
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(() => {
      void refresh();
    }, 3000);
    return () => clearInterval(t);
  }, [hasActive, refresh]);

  const normId = (raw?: string | null) => (raw || '').replace(/-/g, '').toLowerCase();
  const notionSources = useMemo(
    () => sources.filter((s) => s.source_type === 'notion'),
    [sources],
  );
  const importedPageIds = useMemo(
    () => new Set(notionSources.map((s) => normId(s.remote_id)).filter(Boolean)),
    [notionSources],
  );
  const lastSync = useMemo(() => {
    const times = notionSources
      .map((s) => s.last_synced_at || s.uploaded_at)
      .filter(Boolean) as string[];
    if (times.length === 0) return null;
    times.sort();
    return times[times.length - 1];
  }, [notionSources]);

  const driveSources = useMemo(
    () => sources.filter((s) => s.source_type === 'drive'),
    [sources],
  );
  const driveLastSync = useMemo(() => {
    const times = driveSources
      .map((s) => s.last_synced_at || s.uploaded_at)
      .filter(Boolean) as string[];
    if (times.length === 0) return null;
    times.sort();
    return times[times.length - 1];
  }, [driveSources]);
  const driveConnected = provider === 'drive' ? !!status?.drive.connected : false;
  const pickerConfigured = !!PICKER_API_KEY && !!PICKER_APP_ID;

  const githubSources = useMemo(
    () => sources.filter((s) => s.source_type === 'github'),
    [sources],
  );
  const importedRepoIds = useMemo(
    () => new Set(githubSources.map((s) => (s.remote_id || '').toLowerCase()).filter(Boolean)),
    [githubSources],
  );
  const githubLastSync = useMemo(() => {
    const times = githubSources
      .map((s) => s.last_synced_at || s.uploaded_at)
      .filter(Boolean) as string[];
    if (times.length === 0) return null;
    times.sort();
    return times[times.length - 1];
  }, [githubSources]);
  const githubConnected = provider === 'github' ? !!status?.github.connected : false;

  const openRepos = async () => {
    setShowRepos(true);
    setReposLoading(true);
    try {
      const list = await listGithubRepos();
      setRepos(list);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not list GitHub repos');
    } finally {
      setReposLoading(false);
    }
  };

  const openPicker = async () => {
    if (!pickerConfigured) {
      setNotice('Picker not configured. Ask the owner to set NEXT_PUBLIC_GOOGLE_API_KEY and NEXT_PUBLIC_GOOGLE_APP_ID.');
      return;
    }
    setBusy(true);
    try {
      const accessToken = await getPickerToken();
      await loadPickerJs();
      pickWithPicker(accessToken);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not open file picker');
      setBusy(false);
    }
  };

  const pickWithPicker = (accessToken: string) => {
    const w = window as PickerWindow;
    const pickerNs = w.google?.picker as unknown as {
      PickerBuilder: new () => PickerBuilderLike;
      ViewId: { DOCS: unknown };
      Feature: { MULTISELECT_ENABLED: unknown };
      Action: { PICKED: string };
    };
    if (!pickerNs) {
      setNotice('Picker failed to load. Check ad-blocker and reload.');
      setBusy(false);
      return;
    }
    const picker = new pickerNs.PickerBuilder()
      .addView(pickerNs.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setDeveloperKey(PICKER_API_KEY)
      .setAppId(PICKER_APP_ID)
      .enableFeature(pickerNs.Feature.MULTISELECT_ENABLED)
      .setCallback((data: { action: string; docs?: DriveFile[] }) => {
        setBusy(false);
        if (data.action === pickerNs.Action.PICKED && data.docs?.length) {
          const files = data.docs.slice(0, 50).map((d) => ({
            id: d.id, name: d.name || 'Untitled', mimeType: d.mimeType || null,
          }));
          setBusy(true);
          importDriveFiles(files)
            .then(() => setNotice(`Import started for ${files.length} file${files.length > 1 ? 's' : ''}.`))
            .catch((e) => setNotice(e instanceof Error ? e.message : 'Import failed'))
            .finally(() => setBusy(false));
        }
      })
      .build();
    picker.setVisible(true);
  };

  if (!meta) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4 animate-fade-in">
        <BackLink />
        <p className="text-sm text-text-secondary">Unknown connector.</p>
      </div>
    );
  }

  const openImport = async () => {
    setShowImport(true);
    setPagesLoading(true);
    try {
      const list = await listNotionPages();
      setPages(list);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not list Notion pages');
    } finally {
      setPagesLoading(false);
    }
  };

  const connected = provider === 'notion' ? !!status?.notion.connected : false;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
      <BackLink />

      {/* Header: big brand mark + name, like the reference */}
      <div className="flex items-center gap-3">
        {meta.icon}
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{meta.name}</h1>
          <p className="text-xs text-text-secondary mt-0.5">{meta.desc}</p>
        </div>
      </div>

      {notice ? (
        <div className="p-3 rounded-lg border border-border bg-sidebar text-xs text-text-primary flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="p-1 hover:text-text-primary text-text-muted cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}
      {error ? <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">{error}</div> : null}

      {provider === 'drive' ? (
        <>
          {/* Connection card */}
          <div className="rounded-xl border border-border bg-white divide-y divide-border overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary">Connection</p>
                <p className="text-[11px] text-text-secondary">Only files you pick — never your whole Drive</p>
              </div>
              {loading ? (
                <span className="text-[11px] text-text-muted">Loading...</span>
              ) : driveConnected ? (
                <div className="flex items-center gap-2">
                  {driveLastSync ? (
                    <span className="text-[11px] text-text-muted">Synced {timeAgo(driveLastSync)}</span>
                  ) : null}
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">Connected</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void connectDrive()}
                  className="px-4 py-1.5 rounded-lg bg-text-primary text-white text-xs font-medium hover:opacity-90 cursor-pointer"
                >
                  Connect
                </button>
              )}
            </div>
            {driveConnected ? (
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary">Imported sources</p>
                  <p className="text-[11px] text-text-secondary">
                    {driveSources.length} file{driveSources.length === 1 ? '' : 's'} available to Ora and voice
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void openPicker()}
                  className="px-4 py-1.5 rounded-lg bg-accent-hover text-white text-xs font-medium hover:opacity-90 cursor-pointer disabled:opacity-60"
                >
                  {busy ? 'Opening...' : 'Choose from Drive'}
                </button>
              </div>
            ) : null}
          </div>

          {/* Sources */}
          {driveConnected ? (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">Sources</h2>
              <div className="rounded-xl border border-border bg-white overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_90px_70px_90px_96px] gap-2 px-4 py-2 border-b border-border text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  <span>Source</span>
                  <span>Status</span>
                  <span>Chunks</span>
                  <span>Synced</span>
                  <span className="text-right">Actions</span>
                </div>
                {driveSources.length === 0 ? (
                  <p className="p-4 text-[11px] text-text-muted italic">
                    No files imported yet. Click Choose from Drive above.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {driveSources.map((s) => (
                      <div key={s.id} className="grid grid-cols-[1fr_90px_70px_90px_96px] gap-2 items-center px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <GoogleDriveIcon className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{s.filename}</p>
                            {s.sync_error ? <p className="text-[10px] text-red-600 truncate">{s.sync_error}</p> : null}
                          </div>
                        </div>
                        <StatusPill status={s.status} />
                        <span className="text-[11px] text-text-secondary">{s.chunk_count}</span>
                        <span className="text-[11px] text-text-muted">{timeAgo(s.last_synced_at || s.uploaded_at)}</span>
                        <span className="flex items-center justify-end gap-0.5">
                          {s.remote_url ? (
                            <a href={s.remote_url} target="_blank" rel="noreferrer" title="Open original" className="p-1.5 text-text-muted hover:text-text-primary">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            title="Re-sync"
                            onClick={() => void resyncSource(s.id).then(() => setNotice('Re-sync started.'))}
                            className="p-1.5 text-text-muted hover:text-text-primary cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              if (confirm('Delete this imported source?')) void deleteSource(s.id);
                            }}
                            className="p-1.5 text-text-muted hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Disconnect */}
          {driveConnected ? (
            <div className="rounded-xl border border-border bg-white p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-text-primary">Disconnect Google Drive</p>
                <p className="text-[11px] text-text-secondary">Revoke access. Optionally delete everything already imported.</p>
              </div>
              <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOnDisconnect}
                  onChange={(e) => setDeleteOnDisconnect(e.target.checked)}
                  className="accent-zinc-900"
                />
                Also delete copied content when disconnecting
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!confirm('Disconnect Google Drive?')) return;
                  setBusy(true);
                  try {
                    await disconnectProvider('drive', deleteOnDisconnect);
                    setNotice('Google Drive disconnected.');
                  } catch (e) {
                    setNotice(e instanceof Error ? e.message : 'Disconnect failed');
                  } finally {
                    setBusy(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:text-red-600 cursor-pointer disabled:opacity-60"
              >
                Disconnect
              </button>
            </div>
          ) : null}
        </>
      ) : provider === 'github' ? (
        <>
          {/* Connection card */}
          <div className="rounded-xl border border-border bg-white divide-y divide-border overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary">Connection</p>
                <p className="text-[11px] text-text-secondary">Read-only access to repos you shared</p>
              </div>
              {loading ? (
                <span className="text-[11px] text-text-muted">Loading...</span>
              ) : githubConnected ? (
                <div className="flex items-center gap-2">
                  {githubLastSync ? (
                    <span className="text-[11px] text-text-muted">Synced {timeAgo(githubLastSync)}</span>
                  ) : null}
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">Connected</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void connectGithub()}
                  className="px-4 py-1.5 rounded-lg bg-text-primary text-white text-xs font-medium hover:opacity-90 cursor-pointer"
                >
                  Connect
                </button>
              )}
            </div>
            {githubConnected ? (
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary">Imported sources</p>
                  <p className="text-[11px] text-text-secondary">
                    {githubSources.length} repo{githubSources.length === 1 ? '' : 's'} available to Ora and voice
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openRepos}
                  className="px-4 py-1.5 rounded-lg bg-accent-hover text-white text-xs font-medium hover:opacity-90 cursor-pointer"
                >
                  Import repos
                </button>
              </div>
            ) : null}
          </div>

          {/* Sources */}
          {githubConnected ? (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">Sources</h2>
              <div className="rounded-xl border border-border bg-white overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_90px_70px_90px_96px] gap-2 px-4 py-2 border-b border-border text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  <span>Source</span>
                  <span>Status</span>
                  <span>Chunks</span>
                  <span>Synced</span>
                  <span className="text-right">Actions</span>
                </div>
                {githubSources.length === 0 ? (
                  <p className="p-4 text-[11px] text-text-muted italic">
                    No repos imported yet. Click Import repos above (README + docs only).
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {githubSources.map((s) => (
                      <div key={s.id} className="grid grid-cols-[1fr_90px_70px_90px_96px] gap-2 items-center px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <GitHubIcon className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{s.filename}</p>
                            {s.sync_error ? <p className="text-[10px] text-red-600 truncate">{s.sync_error}</p> : null}
                          </div>
                        </div>
                        <StatusPill status={s.status} />
                        <span className="text-[11px] text-text-secondary">{s.chunk_count}</span>
                        <span className="text-[11px] text-text-muted">{timeAgo(s.last_synced_at || s.uploaded_at)}</span>
                        <span className="flex items-center justify-end gap-0.5">
                          {s.remote_url ? (
                            <a href={s.remote_url} target="_blank" rel="noreferrer" title="Open original" className="p-1.5 text-text-muted hover:text-text-primary">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            title="Re-sync"
                            onClick={() => void resyncSource(s.id).then(() => setNotice('Re-sync started.'))}
                            className="p-1.5 text-text-muted hover:text-text-primary cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              if (confirm('Delete this imported source?')) void deleteSource(s.id);
                            }}
                            className="p-1.5 text-text-muted hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Disconnect */}
          {githubConnected ? (
            <div className="rounded-xl border border-border bg-white p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-text-primary">Disconnect GitHub</p>
                <p className="text-[11px] text-text-secondary">Revoke access. Optionally delete everything already imported.</p>
              </div>
              <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOnDisconnect}
                  onChange={(e) => setDeleteOnDisconnect(e.target.checked)}
                  className="accent-zinc-900"
                />
                Also delete copied content when disconnecting
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!confirm('Disconnect GitHub?')) return;
                  setBusy(true);
                  try {
                    await disconnectProvider('github', deleteOnDisconnect);
                    setNotice('GitHub disconnected.');
                  } catch (e) {
                    setNotice(e instanceof Error ? e.message : 'Disconnect failed');
                  } finally {
                    setBusy(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:text-red-600 cursor-pointer disabled:opacity-60"
              >
                Disconnect
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {/* Connection card */}
          <div className="rounded-xl border border-border bg-white divide-y divide-border overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary">Connection</p>
                <p className="text-[11px] text-text-secondary">Pages you shared with DocsChat</p>
              </div>
              {loading ? (
                <span className="text-[11px] text-text-muted">Loading...</span>
              ) : connected ? (
                <div className="flex items-center gap-2">
                  {lastSync ? (
                    <span className="text-[11px] text-text-muted">Synced {timeAgo(lastSync)}</span>
                  ) : null}
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">Connected</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void connectNotion()}
                  className="px-4 py-1.5 rounded-lg bg-text-primary text-white text-xs font-medium hover:opacity-90 cursor-pointer"
                >
                  Connect
                </button>
              )}
            </div>
            {connected ? (
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary">Imported sources</p>
                  <p className="text-[11px] text-text-secondary">
                    {notionSources.length} page{notionSources.length === 1 ? '' : 's'} available to Ora and voice
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openImport}
                  className="px-4 py-1.5 rounded-lg bg-accent-hover text-white text-xs font-medium hover:opacity-90 cursor-pointer"
                >
                  Import pages
                </button>
              </div>
            ) : null}
          </div>

          {/* Sources */}
          {connected ? (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">Sources</h2>
              <div className="rounded-xl border border-border bg-white overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_90px_70px_90px_96px] gap-2 px-4 py-2 border-b border-border text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  <span>Source</span>
                  <span>Status</span>
                  <span>Chunks</span>
                  <span>Synced</span>
                  <span className="text-right">Actions</span>
                </div>
                {notionSources.length === 0 ? (
                  <p className="p-4 text-[11px] text-text-muted italic">
                    No pages imported yet. Click Import pages above.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {notionSources.map((s) => (
                      <div key={s.id} className="grid grid-cols-[1fr_90px_70px_90px_96px] gap-2 items-center px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <NotionIcon className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{s.filename}</p>
                            {s.sync_error ? <p className="text-[10px] text-red-600 truncate">{s.sync_error}</p> : null}
                          </div>
                        </div>
                        <StatusPill status={s.status} />
                        <span className="text-[11px] text-text-secondary">{s.chunk_count}</span>
                        <span className="text-[11px] text-text-muted">{timeAgo(s.last_synced_at || s.uploaded_at)}</span>
                        <span className="flex items-center justify-end gap-0.5">
                          {s.remote_url ? (
                            <a href={s.remote_url} target="_blank" rel="noreferrer" title="Open original" className="p-1.5 text-text-muted hover:text-text-primary">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            title="Re-sync"
                            onClick={() => void resyncSource(s.id).then(() => setNotice('Re-sync started.'))}
                            className="p-1.5 text-text-muted hover:text-text-primary cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              if (confirm('Delete this imported source?')) void deleteSource(s.id);
                            }}
                            className="p-1.5 text-text-muted hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Disconnect */}
          {connected ? (
            <div className="rounded-xl border border-border bg-white p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-text-primary">Disconnect Notion</p>
                <p className="text-[11px] text-text-secondary">Revoke access. Optionally delete everything already imported.</p>
              </div>
              <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOnDisconnect}
                  onChange={(e) => setDeleteOnDisconnect(e.target.checked)}
                  className="accent-zinc-900"
                />
                Also delete copied content when disconnecting
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!confirm('Disconnect Notion?')) return;
                  setBusy(true);
                  try {
                    await disconnectProvider('notion', deleteOnDisconnect);
                    setNotice('Notion disconnected.');
                  } catch (e) {
                    setNotice(e instanceof Error ? e.message : 'Disconnect failed');
                  } finally {
                    setBusy(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:text-red-600 cursor-pointer disabled:opacity-60"
              >
                Disconnect
              </button>
            </div>
          ) : null}
        </>
      )}

      {/* Import modal */}
      {showImport && isMounted
        ? createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setShowImport(false)}
            />
            <div className="relative z-10 bg-white rounded-xl border border-border shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Import from Notion</p>
                  <p className="text-[11px] text-text-secondary">Tick pages to import as sources</p>
                </div>
                <button type="button" onClick={() => setShowImport(false)} className="p-1.5 text-text-muted hover:text-text-primary cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {pagesLoading ? (
                  <p className="text-xs text-text-muted">Loading pages from Notion...</p>
                ) : pages.length === 0 ? (
                  <p className="text-xs text-text-muted">No pages found. In Notion, share pages with this integration first.</p>
                ) : (
                  <div className="space-y-2">
                    {pages.map((p) => {
                      const checked = !!selected[p.id];
                      const alreadyImported = importedPageIds.has(normId(p.id));
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border border-border ${
                            alreadyImported ? 'opacity-60' : 'hover:bg-sidebar cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={alreadyImported ? true : checked}
                            disabled={alreadyImported}
                            onChange={() => setSelected((prev) => {
                              const next = { ...prev };
                              if (next[p.id]) delete next[p.id];
                              else next[p.id] = p;
                              return next;
                            })}
                            className="accent-zinc-900"
                          />
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="block text-xs font-medium text-text-primary truncate">{p.title}</span>
                              {alreadyImported ? (
                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                  Imported
                                </span>
                              ) : null}
                            </span>
                            {p.last_edited_time ? <span className="block text-[10px] text-text-muted">Edited {timeAgo(p.last_edited_time)}</span> : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-[11px] text-text-muted">{Object.keys(selected).length} selected</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowImport(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy || Object.keys(selected).length === 0}
                    onClick={() => {
                      const picked = Object.values(selected);
                      if (picked.length === 0) return;
                      setBusy(true);
                      importNotionPages(picked)
                        .then(() => {
                          setNotice(`Import started for ${picked.length} page${picked.length > 1 ? 's' : ''}.`);
                          setShowImport(false);
                          setSelected({});
                        })
                        .catch((e) => setNotice(e instanceof Error ? e.message : 'Import failed'))
                        .finally(() => setBusy(false));
                    }}
                    className="px-4 py-1.5 rounded-lg bg-accent-hover text-white text-xs font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}

      {/* Repos modal (GitHub) */}
      {showRepos && isMounted
        ? createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setShowRepos(false)}
            />
            <div className="relative z-10 bg-white rounded-xl border border-border shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Import from GitHub</p>
                  <p className="text-[11px] text-text-secondary">README + docs only — max 10 repos</p>
                </div>
                <button type="button" onClick={() => setShowRepos(false)} className="p-1.5 text-text-muted hover:text-text-primary cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {reposLoading ? (
                  <p className="text-xs text-text-muted">Loading repos you shared...</p>
                ) : repos.length === 0 ? (
                  <p className="text-xs text-text-muted">No repos found. Install the app on repos first (GitHub asked during Connect).</p>
                ) : (
                  <div className="space-y-2">
                    {repos.map((r) => {
                      const checked = !!selectedRepos[r.id];
                      const alreadyImported = importedRepoIds.has(r.id.toLowerCase());
                      return (
                        <label
                          key={r.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border border-border ${
                            alreadyImported ? 'opacity-60' : 'hover:bg-sidebar cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={alreadyImported ? true : checked}
                            disabled={alreadyImported}
                            onChange={() => setSelectedRepos((prev) => {
                              const next = { ...prev };
                              if (next[r.id]) delete next[r.id];
                              else next[r.id] = r;
                              return next;
                            })}
                            className="accent-zinc-900"
                          />
                          <GitHubIcon className="w-4 h-4 shrink-0" />
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="block text-xs font-medium text-text-primary truncate">{r.name}</span>
                              {r.private ? (
                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-subtle text-text-secondary">
                                  Private
                                </span>
                              ) : null}
                              {alreadyImported ? (
                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                  Imported
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-[11px] text-text-muted">{Object.keys(selectedRepos).length} selected</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowRepos(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy || Object.keys(selectedRepos).length === 0}
                    onClick={() => {
                      const picked = Object.values(selectedRepos);
                      if (picked.length === 0) return;
                      setBusy(true);
                      importGithubRepos(picked)
                        .then(() => {
                          setNotice(`Import started for ${picked.length} repo${picked.length > 1 ? 's' : ''}.`);
                          setShowRepos(false);
                          setSelectedRepos({});
                        })
                        .catch((e) => setNotice(e instanceof Error ? e.message : 'Import failed'))
                        .finally(() => setBusy(false));
                    }}
                    className="px-4 py-1.5 rounded-lg bg-accent-hover text-white text-xs font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/connectors"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Connections
    </Link>
  );
}
