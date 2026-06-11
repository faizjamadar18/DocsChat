import { auth } from './auth';
import { API_BASE_URL } from './config';

function parseErrorDetail(detail: unknown): string {
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === 'object' && d && 'msg' in d ? d.msg : String(d))).join(', ');
  }
  if (typeof detail === 'string') {
    return detail;
  }
  return 'API Request Failed';
}

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const token = auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        auth.removeToken();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errorData.detail));
    }

    if (response.status === 204) {
        return null;
    }
    
    return response.json();
  },

  get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint: string, body: any, options?: RequestInit) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  delete(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};
