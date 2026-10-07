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

function toAbsoluteToolUrl(pathWithQuery: string): string | null {
  // Vapi's servers must reach this URL over public HTTPS.
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
  const savedRef = useRef(false);
  const workspaceRef = useRef<string | undefined>(undefined);

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
      clearTimer();
      try {
        vapiRef.current?.stop();
      } catch {
        // ignore
      }
      vapiRef.current = null;
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
          const text: string = message.transcript || '';
          if (message.role === 'user') {
            userTextRef.current = `${userTextRef.current} ${text}`.trim();
            setBothStatus('thinking');
          } else {
            oraTextRef.current = `${oraTextRef.current} ${text}`.trim();
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
        const msg = typeof err?.error?.message === 'string' ? err.error.message : '';
        if (/invalid.*key|unauthorized|401/i.test(msg)) {
          setErrorMsg('Your Vapi key looks wrong or expired. Check Settings -> Account.');
          setNeedsKey(true);
        } else if (/microphone|permission|not allowed/i.test(msg)) {
          setErrorMsg('Please allow microphone access in your browser to talk to Ora.');
        } else if (/credit|billing|payment|quota/i.test(msg)) {
          setErrorMsg('Your free Vapi credit seems over. Add billing in Vapi or use a new free key.');
        } else {
          setErrorMsg('Voice call failed to start. Please try again.');
        }
        setBothStatus('error');
        setTimeout(() => endVoice('error'), 3500);
      });
    },
    [endVoice, setBothStatus, startTimer]
  );

  const startVoice = useCallback(async () => {
    if (statusRef.current !== 'idle' && statusRef.current !== 'error') return;
    setErrorMsg(null);
    setNeedsKey(false);
    setBothStatus('checking');

    const wsId = currentWorkspace?.id;
    if (!wsId) {
      setErrorMsg('Open a workspace first, then talk to Ora.');
      setBothStatus('error');
      setTimeout(() => setBothStatus('idle'), 3000);
      return;
    }

    try {
      // 1. Does this user have their own key? (no call, no cost if missing)
      const keyStatus = await api.get('/voice/key-status');
      if (!keyStatus?.has_key) {
        setNeedsKey(true);
        setBothStatus('idle');
        return;
      }
      // 2. Raw public key for browser SDK (owner-only, HTTPS, never logged).
      const { public_key: publicKey } = await api.get('/voice/key');
      if (!publicKey) throw new Error('missing-key');
      // 3. Short-lived session token so Vapi servers can ask our helper safely.
      const session = await api.post(
        '/voice/session',
        { workspace_id: wsId },
        { headers: { 'X-Workspace-Id': wsId } }
      );
      const toolUrl = toAbsoluteToolUrl(`/voice/tool-call?token=${encodeURIComponent(session.token)}`);
      if (!toolUrl) {
        setErrorMsg('Voice needs a public site address. Deploy with NEXT_PUBLIC_API_URL set, or test with an https tunnel.');
        setBothStatus('error');
        setTimeout(() => setBothStatus('idle'), 4000);
        return;
      }

      if (!VapiClassRef.current) {
        const mod = await import('@vapi-ai/web');
        VapiClassRef.current = mod.default;
      }
      try {
        vapiRef.current?.stop();
      } catch {
        // ignore
      }
      const vapi = new VapiClassRef.current(publicKey);
      vapiRef.current = vapi;
      attachListeners(vapi);

      userTextRef.current = '';
      oraTextRef.current = '';
      savedRef.current = false;
      workspaceRef.current = wsId;
      setBothStatus('connecting');

      // Transient assistant: zero dashboard setup for users + cost-saver stack.
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
        endCallOnSilence: true,
      } as never);
    } catch {
      setErrorMsg('Could not start voice. Check your key in Settings -> Account and try again.');
      setBothStatus('error');
      setTimeout(() => setBothStatus('idle'), 3500);
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
