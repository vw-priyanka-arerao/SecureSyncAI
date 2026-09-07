const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function buildUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

export function toBasicAuth(username, password) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

export function toBearerAuth(token) {
  return `Bearer ${token}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function createApiClient(getCredentials, onUnauthorized) {
  async function request(path, options = {}) {
    const credentials = options.credentialsOverride || getCredentials();
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (credentials?.token) {
      headers.set('Authorization', toBearerAuth(credentials.token));
    } else if (credentials?.username && credentials?.password) {
      headers.set('Authorization', toBasicAuth(credentials.username, credentials.password));
    }

    try {
      return await parseResponse(await fetch(buildUrl(path), {
        method: options.method || 'GET',
        headers,
        body: options.body instanceof FormData
          ? options.body
          : options.body
            ? JSON.stringify(options.body)
            : undefined
      }));
    } catch (error) {
      if (error.status === 401 && onUnauthorized) {
        onUnauthorized();
      }
      throw error;
    }
  }

  async function archiveDocument(id) {
    try {
      return await request(`/api/documents/${id}`, { method: 'DELETE' });
    } catch (error) {
      // Compatibility fallback for environments where DELETE is blocked/unsupported.
      if (error?.status === 405) {
        return request(`/api/documents/${id}/archive`, { method: 'POST' });
      }
      throw error;
    }
  }

  return {
    request,
    me: () => request('/api/auth/me'),
    listUsers: (reviewersOnly = false) => request(`/api/users?reviewersOnly=${reviewersOnly}`),
    getDashboard: () => request('/api/dashboard'),
    listDocuments: (includeDeleted = false) => request(`/api/documents?includeDeleted=${includeDeleted}`),
    getDocument: (id, includeDeleted = false) => request(`/api/documents/${id}?includeDeleted=${includeDeleted}`),
    deleteDocument: (id) => archiveDocument(id),
    restoreDocument: (id) => request(`/api/documents/${id}/restore`, { method: 'POST' }),
    createDocument: (payload) => request('/api/documents', { method: 'POST', body: payload }),
    uploadDocument: (payload) => {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });
      return request('/api/documents/upload', { method: 'POST', body: formData });
    },
    submitDocument: (id, payload) => request(`/api/documents/${id}/submit`, { method: 'POST', body: payload }),
    startReview: (id, payload) => request(`/api/documents/${id}/start-review`, { method: 'POST', body: payload }),
    reviewDocument: (id, payload) => request(`/api/documents/${id}/review`, { method: 'POST', body: payload }),
    createVersion: (id, payload) => request(`/api/documents/${id}/versions`, { method: 'POST', body: payload }),
    analyzeDocument: (id) => request(`/api/documents/${id}/ai-analysis`),
    chatbotQuery: (query, maxResults = 5) => request('/api/chatbot/query', { method: 'POST', body: { query, maxResults } }),
    listNotifications: () => request('/api/notifications'),
    getOverdueNotificationCount: () => request('/api/notifications/overdue/count'),
    markNotificationRead: (id, read) => request(`/api/notifications/${id}/read`, { method: 'POST', body: { read } }),
    runNotificationReminders: () => request('/api/notifications/reminders/run', { method: 'POST' }),
    listAuditLogs: (documentId) => request(documentId ? `/api/audit-logs?documentId=${documentId}` : '/api/audit-logs')
  };
}

