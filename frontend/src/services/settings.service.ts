import api from './api';
import { Settings } from '../types';

export const settingsService = {
  getSettings: async (): Promise<Settings> => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (settings: Partial<Settings>): Promise<Settings> => {
    const response = await api.patch('/settings', settings);
    return response.data;
  },
};