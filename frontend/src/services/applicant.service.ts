import api from './api';
import { Applicant, ApplicantWithDetails, Stats } from '../types';

interface ApplicantsResponse {
  applicants: Applicant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface GetApplicantsParams {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const applicantService = {
  getApplicants: async (params: GetApplicantsParams = {}): Promise<ApplicantsResponse> => {
    const response = await api.get('/applicants', { params });
    return response.data;
  },

  getApplicant: async (id: number): Promise<ApplicantWithDetails> => {
    const response = await api.get(`/applicants/${id}`);
    return response.data;
  },

  updateStatus: async (id: number, status: 'accepted' | 'rejected', notes?: string): Promise<void> => {
    await api.patch(`/applicants/${id}/status`, { status, notes });
  },

  getStats: async (): Promise<Stats> => {
    const response = await api.get('/applicants/stats');
    return response.data;
  },

  exportApplicants: async (params: { type?: string; status?: string }): Promise<Blob> => {
    const response = await api.get('/applicants/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
  getFileUrl: (path: string): string => {
    // Files are served at /uploads directly, not /api/uploads
    return path;
  },
};