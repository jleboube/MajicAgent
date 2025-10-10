const normalize = (value) => value.replace(/\/$/, '');

const detectDefaultBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const { origin, hostname } = window.location;

  if (/^(localhost|127\.0\.0\.1)/.test(hostname)) {
    return 'http://localhost:4004';
  }

  return origin;
};

let rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!rawBaseUrl) {
  rawBaseUrl = detectDefaultBaseUrl();
}

export const API_BASE_URL = normalize(rawBaseUrl || '');
export const GOOGLE_OAUTH_URL = `${API_BASE_URL ? `${API_BASE_URL}/api/auth/google` : '/api/auth/google'}`;
