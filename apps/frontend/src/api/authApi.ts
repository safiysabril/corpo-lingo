import type {
  RegisterPayload,
  LoginPayload,
  AuthResponse,
  UserProfile,
  TranslationHistoryItem,
} from '@corpo-lingo/shared';

const BASE = '/api/v1/auth';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  await request(`${BASE}/logout`, { method: 'POST' });
}

export async function getMe(): Promise<UserProfile> {
  const data = await request<{ success: boolean; user: UserProfile }>(`${BASE}/me`);
  return data.user;
}

export async function getHistory(): Promise<TranslationHistoryItem[]> {
  const data = await request<{ success: boolean; data: TranslationHistoryItem[] }>(
    '/api/v1/translate/history',
  );
  return data.data;
}
