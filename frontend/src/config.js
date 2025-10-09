const detectDefaultBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:4004';
  }

  if (window.location.origin.includes('localhost:5173')) {
    return 'http://localhost:4004';
  }

  return '';
};

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || detectDefaultBaseUrl();
export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');
export const GOOGLE_OAUTH_URL = `${API_BASE_URL || ''}/api/auth/google`;
