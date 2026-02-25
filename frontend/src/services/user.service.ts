import api from './api';
import { User } from '../types';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  inviteUser: async (email: string, role: string): Promise<User> => {
    const response = await api.post('/users', { email, role });
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  resendInvitation: async (id: number): Promise<any> => {
    const response = await api.post(`/users/${id}/resend`);
    return response.data;
  },
};