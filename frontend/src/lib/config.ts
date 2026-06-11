const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
export const API_BASE_URL = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/api` : '/api';
