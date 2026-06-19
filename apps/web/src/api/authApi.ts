import type {
  RegisterPayload,
  LoginPayload,
  AuthResponse,
  UserProfile,
  TranslationHistoryItem,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@corpo-lingo/shared';

const BASE = '/api/v1/auth';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init });
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error (${res.status}). Please try again later.`);
  }
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

export async function getMe(): Promise<UserProfile | null> {
  const res = await fetch(`${BASE}/me`, { credentials: 'include' });
  if (res.status === 401) return null;
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error (${res.status}). Please try again later.`);
  }
  const data: { success: boolean; user: UserProfile } = await res.json();
  if (!res.ok) throw new Error((data as any).error || 'Request failed');
  return data.user;
}

export async function getHistory(): Promise<TranslationHistoryItem[]> {
  const data = await request<{ success: boolean; data: TranslationHistoryItem[] }>(
    '/api/v1/translate/history',
  );
  return data.data;
}

export async function deleteHistoryItem(id: string): Promise<void> {
  await request(`/api/v1/translate/history/${id}`, { method: 'DELETE' });
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await request(`${BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await request(`${BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
