import type { TranslationMode, FormalityLevel } from './constants';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface TranslationHistoryItem {
  id: string;
  input: string;
  output: string;
  mode: TranslationMode;
  formality: FormalityLevel;
  createdAt: string;
}
