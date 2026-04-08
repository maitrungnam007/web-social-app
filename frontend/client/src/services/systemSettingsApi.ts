import api from './apiClient';

export interface SystemConfig {
  defaultBanDays: number;
  notifyOnViolation: boolean;
  maxPostsPerDay: number;
  maxCommentsPerDay: number;
  reportsToAutoHide: number;
  violationsToAutoBan: number;
  blockBadWords: boolean;
}

export interface BadWord {
  id: number;
  word: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  category: string;
}

const systemSettingsApi = {
  // Lay c?u hinh h? th?ng
  getConfig: async () => {
    const response = await api.get('/SystemSettings/config');
    return response.data;
  },

  // C?p nh?t c?u hinh
  updateSetting: async (key: string, value: string) => {
    const response = await api.put('/SystemSettings/config', { key, value });
    return response.data;
  },

  // Lay tat ca c?u hinh
  getAllSettings: async () => {
    const response = await api.get('/SystemSettings');
    return response.data;
  },

  // Lay danh sch t? kh?a c?m
  getBadWords: async (category?: string) => {
    const response = await api.get('/SystemSettings/badwords', {
      params: { category }
    });
    return response.data;
  },

  // Thm t? kh?a c?m
  addBadWord: async (word: string, category: string = 'Profanity') => {
    const response = await api.post('/SystemSettings/badwords', { word, category });
    return response.data;
  },

  // Xa t? kh?a c?m
  deleteBadWord: async (id: number) => {
    const response = await api.delete(`/SystemSettings/badwords/${id}`);
    return response.data;
  },

  // B?t/t?t t? kh?a c?m
  toggleBadWord: async (id: number) => {
    const response = await api.patch(`/SystemSettings/badwords/${id}/toggle`);
    return response.data;
  }
};

export default systemSettingsApi;
