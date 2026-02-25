export interface User {
  id: number;
  username: string;
  email: string | null;
  role: 'super_admin' | 'reviewer';
  created_at: string;
}

export interface Applicant {
  id: number;
  telegram_id: string;
  telegram_username: string | null;
  type: 'singer' | 'mission';
  name: string;
  phone: string;
  church: string;
  address: string;
  status: 'pending' | 'accepted' | 'rejected';
  photo_url: string | null;
  audio_url: string | null;
  reviewer_id: number | null;
  reviewer_name: string | null;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SingerDetails {
  id: number;
  applicant_id: number;
  worship_ministry_involved: boolean;
  audio_url: string;
  audio_duration: number;
}

export interface MissionDetails {
  id: number;
  applicant_id: number;
  profession: string;
  mission_interest: boolean;
  bio: string;
  motivation: string;
}

export interface ApplicantWithDetails extends Applicant {
  details: SingerDetails | MissionDetails | null;
}

export interface Stats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  singers: number;
  missions: number;
}