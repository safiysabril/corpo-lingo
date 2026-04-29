export interface TranslatePayload {
  text: string;
  mode: string;
  formality: string;
}

export interface TranslateResponse {
  success: boolean;
  data: {
    original: string;
    translated: string;
    mode: string;
    formality: string;
  };
  meta: {
    provider: string;
    model: string;
    usage: Record<string, number> | null;
    timestamp: string;
  };
  error?: string;
}

const BASE_URL = 'http://localhost:3000/api/v1';

export async function translateText(payload: TranslatePayload): Promise<TranslateResponse> {
  const res = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data: TranslateResponse = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to translate');
  }

  return data;
}