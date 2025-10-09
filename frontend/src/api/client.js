import { API_BASE_URL } from '../config';

function buildUrl(path) {
  if (path.startsWith('http')) return path;
  const base = API_BASE_URL;
  if (!base) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  if (path.startsWith('/')) {
    return `${base}${path}`;
  }
  return `${base}/${path}`;
}

export async function apiFetch(path, { token, method = 'GET', body, headers = {}, signal } = {}) {
  const url = buildUrl(path);
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    signal
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.msg || errorBody.error || errorMessage;
    } catch (_) {
      // ignore JSON parse errors
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}
