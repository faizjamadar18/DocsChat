'use client';

import { useEffect } from 'react';
import { API_BASE_URL } from '../lib/config';

const WARMUP_TIMEOUT_MS = 5000;
const WARMUP_RETRIES = 3;
const RETRY_GAP_MS = 2000;

/**
 * Fire-and-forget backend warmup for Render free-tier cold starts.
 * Pings GET {API}/health in the background on page open so the Render
 * instance boots while the visitor is still reading the landing page.
 * Never blocks render, never throws, never shows UI.
 */
export function useBackendWarmup(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    let cancelled = false;

    const pingOnce = async (): Promise<boolean> => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);
      try {
        const res = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-store',
          credentials: 'omit',
          signal: controller.signal,
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        window.clearTimeout(timer);
      }
    };

    const warm = async () => {
      for (let attempt = 0; attempt < WARMUP_RETRIES; attempt += 1) {
        if (cancelled) return;
        const ok = await pingOnce();
        if (ok || cancelled) return;
        if (attempt < WARMUP_RETRIES - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, RETRY_GAP_MS));
        }
      }
    };

    void warm();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
