'use client';

import { useBackendWarmup } from '../hooks/useBackendWarmup';

/** Mount on landing + login: warms the Render backend, renders nothing. */
export default function BackendWarmup() {
  useBackendWarmup(true);
  return null;
}
