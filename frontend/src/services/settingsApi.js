import { apiRequest } from './apiClient';

export const settingsApi = {
  get: () => apiRequest('/settings'),
  update: preferences => apiRequest('/settings', {
    method: 'PATCH',
    body: JSON.stringify({ preferences }),
  }),
  exportData: () => apiRequest('/settings/export'),
  logoutAll: () => apiRequest('/settings/logout-all', { method: 'POST' }),
  deleteAccount: confirmation => apiRequest('/settings/account', {
    method: 'DELETE',
    body: JSON.stringify({ confirmation }),
  }),
};
