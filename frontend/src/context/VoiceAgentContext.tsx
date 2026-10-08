'use client';
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { usePathname } from 'next/navigation';
import { api } from '../lib/api';
import { API_BASE_URL } from '../lib/config';
import { useWorkspace } from './WorkspaceContext';

export type VoiceStatus =
  | 'idle'
  | 'checking'
  | 'warming'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error';

interface VoiceAgentContextType {
  status: VoiceStatus;
  isActive: boolean;
  isMuted: boolean;
  volumeLevel: number;
  elapsedSeconds: number;
  errorMsg: string | null;
  needsKey: boolean;
  startVoice: () => void;
  endVoice: (reason?: string) => void;
  toggleMute: () => void;
  dismissKeyPrompt: () => void;
}

const VoiceAgentContext = createContext<VoiceAgentContextType | null>(null);

const MAX_CALL_SECONDS = 180; // auto-bye at 3 min to protect free credit
const IDLE_END_SECONDS = 20; // end after 20s of no speech activity

// Pull a readable message out of Vapi/SDK/network errors (never includes secrets).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractErrorText(err: any): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  const candidates = [err?.message, err?.error?.message, err?.msg];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  try {
    const s = JSON.stringify(err);
    if (typeof s === 'string' && s.length > 2 && s.length < 500) return s;
  } catch {
    // ignore
  }
  return '';
}

function toAbsoluteToolUrl(pathWithQuery: string): string | null {  // Vapi's servers must reach this URL over public HTTPS.
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return `${API_BASE_URL.replace(/\/+$/, '')}${pathWithQuery}`;
  }
  if (typeof window !== 'undefined' && /^https:\/\//.test(window.location.origin)) {
    return `${window.location.origin.replace(/\/+$/, '')}${pathWithQuery}`;
  }
  return null;
}

export function VoiceAgentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const VapiClassRef = useRef<any>(null);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const statusRef = useRef<VoiceStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(0);
  const userTextRef = useRef('');
  const oraTextRef = useRef('');
  const lastChunkRef = useRef({ user: '', ora: '' });
  const savedRef = useRef(false);
  const callConnectedRef = useRef(false);
  const workspaceRef = useRef<string | undefined>(undefined);
  // Tap-to-talk sequence guard: ending the call cancels a start still in flight.
  const startSeqRef = useRef(0);
  // Warmed-up bundle (key + tool token) prepared in the background after login.
  const bundleRef = useRef<{
    publicKey: string;
    token: string;
    workspaceId: string;
    at: number;
  } | null>(null);
  const warmedForRef = useRef<string | null>(null);

  // Bundle is good for 8 min (server tokens live 10 min).
  const freshBundleFor = useCallback((wsId: string) => {
    const b = bundleRef.current;
    if (!b || b.workspaceId !== wsId) return null;
    if (Date.now() - b.at > 8 * 60 * 1000) return null;
    return b;
  }, []);

  const setBothStatus = useCallback((s: VoiceStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const saveVoiceLog = useCallback(async () => {
    if (savedRef.current) return;
    savedRef.current = true;
    const wsId = workspaceRef.current;
    const userText = userTextRef.current.trim().slice(0, 2000);
    const oraText = oraTextRef.current.trim().slice(0, 2000);
    if (!wsId || (!userText && !oraText)) return;
    try {
      const duration = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
      await api.post('/voice/logs', {
        workspace_id: wsId,
        user_text: userText || '(voice call)',
        ora_text: oraText || '',
        duration_seconds: duration,
      });
      window.dispatchEvent(new CustomEvent('voice-logs-updated'));
    } catch {
      // Best-effort; never break the call UI because history failed.
    }
  }, []);

  const endVoice = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_reason?: string) => {
      // Cancel any tap-to-talk still warming up in the background.
      startSeqRef.current += 1;
      clearTimer();
      try {
        vapiRef.current?.stop();
      } catch {
        // ignore
      }
      vapiRef.current = null;
      callConnectedRef.current = false;
      setIsMuted(false);
      setVolumeLevel(0);
      setElapsedSeconds(0);
      setBothStatus('idle');
      void saveVoiceLog();
    },
    [clearTimer, saveVoiceLog, setBothStatus]
  );

  // Cost guard: tick timer, auto-end on max duration or idle silence.
  const startTimer = useCallback(() => {
    clearTimer();
    startTimeRef.current = Date.now();
    lastActivityRef.current = Date.now();
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
      const idleFor = (Date.now() - lastActivityRef.current) / 1000;
      if (elapsed >= MAX_CALL_SECONDS) {
        try {
          vapiRef.current?.say('Lets continue in a fresh chat to save your minutes. Bye for now!', true);
        } catch {
          endVoice('max-duration');
        }
        setTimeout(() => endVoice('max-duration'), 4000);
        clearTimer();
      } else if (idleFor >= IDLE_END_SECONDS && statusRef.current !== 'idle') {
        endVoice('idle-timeout');
      }
    }, 1000);
  }, [clearTimer, endVoice]);

  // End an active call when the user navigates (no background billing).
  useEffect(() => {
    if (statusRef.current !== 'idle') {
      endVoice('route-change');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const attachListeners = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vapi: any) => {
      vapi.on('call-start', () => {
        lastActivityRef.current = Date.now();
        callConnectedRef.current = true;
        setBothStatus('listening');
        startTimer();
      });
      vapi.on('call-end', () => {
        endVoice('call-end');
      });
      vapi.on('speech-start', () => {
        lastActivityRef.current = Date.now();
        if (statusRef.current === 'listening' || statusRef.current === 'thinking') {
          setBothStatus('speaking');
        }
      });
      vapi.on('speech-end', () => {
        lastActivityRef.current = Date.now();
        if (statusRef.current === 'speaking') setBothStatus('listening');
      });
      vapi.on('volume-level', (vol: number) => setVolumeLevel(vol || 0));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.on('message', (message: any) => {
        if (!message) return;
        if (message.type === 'transcript') {
          lastActivityRef.current = Date.now();
          // Vapi streams every utterance twice (partial, then final). Only the
          // final version goes into the log, or every sentence repeats.
          if (message.transcriptType === 'partial') return;
          const text: string = (message.transcript || '').trim();
          if (!text) return;
          if (message.role === 'user') {
            if (text !== lastChunkRef.current.user) {
              userTextRef.current = `${userTextRef.current} ${text}`.trim();
              lastChunkRef.current.user = text;
            }
            setBothStatus('thinking');
          } else {
            if (text !== lastChunkRef.current.ora) {
              oraTextRef.current = `${oraTextRef.current} ${text}`.trim();
              lastChunkRef.current.ora = text;
            }
            setBothStatus('speaking');
          }
        } else if (message.type === 'tool-calls') {
          lastActivityRef.current = Date.now();
          setBothStatus('thinking');
        } else if (message.type === 'speech-update' && message.status === 'started') {
          lastActivityRef.current = Date.now();
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.on('error', (err: any) => {
        console.error('[Ora voice] call error:', err);
        const msg = extractErrorText(err);
        // "Meeting has ended" after a successful connection is a NORMAL end
        // (silence timeout / Vapi closed the room) — close quietly, no scare card.
        if (/meeting has ended|meeting ended/i.test(msg)) {
          if (callConnectedRef.current) {
            endVoice('meeting-ended');
            return;
          }
        }
        if (/missing authorization|invalid.*key|unauthorized|\b401\b/i.test(msg)) {
          setErrorMsg(
            'Vapi rejected the key (401). In dashboard.vapi.ai → API Keys → your Public key: 1) turn ON Transient Assistant, 2) add this site to Allowed Origins, 3) confirm it starts with pk_. Then re-save it in Settings.'
          );
        } else if (/microphone|permission|not allowed/i.test(msg)) {
          setErrorMsg('Please allow microphone access in your browser to talk to Ora.');
        } else if (/credit|billing|payment|quota/i.test(msg)) {
          setErrorMsg('Your free Vapi credit seems over. Add billing in Vapi or use a new free key.');
        } else {
          setErrorMsg(msg ? `Voice error: ${msg.slice(0, 160)}` : 'Voice call failed to start. Please try again.');
        }
        setBothStatus('error');
        setTimeout(() => endVoice('error'), 6000);
      });
    },
    [endVoice, setBothStatus, startTimer]
  );

  // Background warmup after login: preload the voice toolkit + fetch one
  // bootstrap bundle (key + tool token) so a later tap skips all waiting.
  // Runs before any Vapi call connects, so it never touches Vapi billing.
  const warmupVoice = useCallback(
    async (wsId: string) => {
      try {
        if (!VapiClassRef.current) {
          const mod = await import('@vapi-ai/web');
          VapiClassRef.current = mod.default;
        }
        const data = await api.post(
          '/voice/bootstrap',
          { workspace_id: wsId },
          { headers: { 'X-Workspace-Id': wsId } }
        );
        if (data?.has_key && data?.public_key && data?.token) {
          bundleRef.current = {
            publicKey: data.public_key,
            token: data.token,
            workspaceId: data.workspace_id || wsId,
            at: Date.now(),
          };
        }
      } catch {
        // Warmup is best-effort; the tap path retries everything anyway.
      }
    },
    []
  );

  useEffect(() => {
    const wsId = currentWorkspace?.id;
    if (!wsId || warmedForRef.current === wsId) return;
    warmedForRef.current = wsId;
    void warmupVoice(wsId);
  }, [currentWorkspace?.id, warmupVoice]);

  const startVoice = useCallback(async () => {
    if (statusRef.current !== 'idle' && statusRef.current !== 'error') return;
    const seq = ++startSeqRef.current;
    const tapAt = performance.now();
    const alive = () => seq === startSeqRef.current;
    setErrorMsg(null);
    setNeedsKey(false);
    // Bubble opens instantly with roaming eyes — waiting now has feedback.
    setBothStatus('warming');

    const wsId = currentWorkspace?.id;
    if (!wsId) {
      setErrorMsg('Open a workspace first, then talk to Ora.');
      setBothStatus('error');
      setTimeout(() => setBothStatus('idle'), 3000);
      return;
    }

    try {
      // One backend round trip (key + tool token together). Reuses the
      // background bundle when fresh so warm taps skip even this call.
      let bundle = freshBundleFor(wsId);
      if (!bundle) {
        const t = performance.now();
        const data = await api.post(
          '/voice/bootstrap',
          { workspace_id: wsId },
          { headers: { 'X-Workspace-Id': wsId } }
        );
        console.info(`[Ora voice] bootstrap took ${Math.round(performance.now() - t)}ms`);
        if (!alive()) return;
        if (!data?.has_key) {
          setNeedsKey(true);
          setBothStatus('idle');
          return;
        }
        bundle = {
          publicKey: data.public_key,
          token: data.token,
          workspaceId: data.workspace_id || wsId,
          at: Date.now(),
        };
        bundleRef.current = bundle;
      }
      if (!bundle.publicKey) throw new Error('missing-key');
      const toolUrl = toAbsoluteToolUrl(`/voice/tool-call?token=${encodeURIComponent(bundle.token)}`);
      if (!toolUrl) {
        setErrorMsg('Voice needs a public site address. Deploy with NEXT_PUBLIC_API_URL set, or test with an https tunnel.');
        setBothStatus('error');
        setTimeout(() => setBothStatus('idle'), 4000);
        return;
      }

      if (!VapiClassRef.current) {
        const t = performance.now();
        const mod = await import('@vapi-ai/web');
        VapiClassRef.current = mod.default;
        console.info(`[Ora voice] SDK import took ${Math.round(performance.now() - t)}ms`);
      }
      if (!alive()) return;
      try {
        vapiRef.current?.stop();
      } catch {
        // ignore
      }
      const vapi = new VapiClassRef.current(bundle.publicKey);
      vapiRef.current = vapi;
      attachListeners(vapi);

      userTextRef.current = '';
      oraTextRef.current = '';
      lastChunkRef.current = { user: '', ora: '' };
      savedRef.current = false;
      callConnectedRef.current = false;
      workspaceRef.current = wsId;
      setBothStatus('connecting');

      // Transient assistant: zero dashboard setup for users + cost-saver stack.
      const t = performance.now();
      await vapi.start({
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are Ora, a warm workspace voice helper. Answer in 2-3 short spoken lines. Never read file names aloud. For document questions call search_workspace_knowledge once. For hi/thanks just reply warmly without tools. If nothing found, say you could not find it and suggest uploading the file.',
            },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'search_workspace_knowledge',
                description: 'Look up the user workspace documents for a question',
                parameters: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'The user question to search for' },
                  },
                  required: ['query'],
                },
              },
              server: { url: toolUrl },
            },
          ],
        },
        voice: { provider: 'vapi', voiceId: 'Elliot' },
        transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en' },
        firstMessage: 'Hey, I am Ora. Ask me about your documents.',
        clientMessages: ['transcript', 'tool-calls'],
        serverMessages: ['tool-calls'],
        silenceTimeoutSeconds: 20,
        maxDurationSeconds: MAX_CALL_SECONDS,
        startSpeakingPlan: {
          waitSeconds: 1.2,
          transcriptionEndpointingPlan: {
            onPunctuationSeconds: 1.5,
            onNoPunctuationSeconds: 3.0,
            onNumberSeconds: 2.0,
          },
        },
        stopSpeakingPlan: {
          numWords: 0,
          voiceSeconds: 0.3,
          backoffSeconds: 1.5,
        },
      } as never);
      console.info(
        `[Ora voice] vapi join took ${Math.round(performance.now() - t)}ms ` +
          `(tap-to-join ${Math.round(performance.now() - tapAt)}ms total)`
      );
      if (!alive()) {
        // User cancelled (red button / outside tap) while joining.
        try {
          vapi.stop();
        } catch {
          // ignore
        }
        return;
      }
    } catch (err) {
      if (!alive()) return; // cancelled — endVoice already reset the UI
      console.error('[Ora voice] start failed:', err);
      const raw = extractErrorText(err);
      if (/missing authorization|unauthorized|\b401\b|invalid.*key/i.test(raw)) {
        setErrorMsg(
          'Vapi rejected the key (401 Missing Authorization). In dashboard.vapi.ai → API Keys → your Public key: 1) turn ON Transient Assistant, 2) add this site URL to Allowed Origins, 3) confirm the key starts with pk_. Then re-save it in Settings → Account.'
        );
      } else {
        setErrorMsg(
          raw
            ? `Could not start voice: ${raw.slice(0, 160)}`
            : 'Could not start voice. Check your key in Settings → Account and try again.'
        );
      }
      setBothStatus('error');
      setTimeout(() => setBothStatus('idle'), 6000);
    }
  }, [attachListeners, currentWorkspace?.id, setBothStatus]);

  const toggleMute = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    const next = !isMuted;
    try {
      vapi.setMuted(next);
    } catch {
      // ignore
    }
    setIsMuted(next);
  }, [isMuted]);

  const dismissKeyPrompt = useCallback(() => setNeedsKey(false), []);

  return (
    <VoiceAgentContext.Provider
      value={{
        status,
        isActive: status !== 'idle' && status !== 'error' && status !== 'checking',
        isMuted,
        volumeLevel,
        elapsedSeconds,
        errorMsg,
        needsKey,
        startVoice,
        endVoice,
        toggleMute,
        dismissKeyPrompt,
      }}
    >
      {children}
    </VoiceAgentContext.Provider>
  );
}

export function useVoiceAgent() {
  const ctx = useContext(VoiceAgentContext);
  if (!ctx) throw new Error('useVoiceAgent must be used within VoiceAgentProvider');
  return ctx;
}
