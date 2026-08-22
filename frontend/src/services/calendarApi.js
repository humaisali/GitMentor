import { apiRequest } from './apiClient';

export const calendarApi = {
  connectionStatus: (verify = false) => apiRequest(`/auth/google/status${verify ? '?verify=true' : ''}`),
  connect: (returnTo = '/settings') => apiRequest('/auth/google/connect', {
    method: 'POST',
    body: JSON.stringify({ returnTo }),
  }),
  disconnect: () => apiRequest('/auth/google/disconnect', { method: 'DELETE' }),
  list: (query = '') => apiRequest(`/calendar/sessions${query}`),
  create: (data) => apiRequest('/calendar/sessions', { method: 'POST', body: JSON.stringify(data) }),
  createBatch: (sessions, atomic = true) => apiRequest('/calendar/sessions/batch', {
    method: 'POST',
    body: JSON.stringify({ sessions, atomic }),
  }),
  update: (id, data) => apiRequest(`/calendar/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  cancel: (id) => apiRequest(`/calendar/sessions/${id}`, { method: 'DELETE' }),
  complete: (id) => apiRequest(`/calendar/sessions/${id}/complete`, { method: 'POST' }),
  retry: (id) => apiRequest(`/calendar/sessions/${id}/retry`, { method: 'POST' }),
  reconcile: () => apiRequest('/calendar/reconcile', { method: 'POST' }),
};
