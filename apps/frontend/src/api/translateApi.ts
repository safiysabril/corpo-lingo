import type { TranslatePayload, TranslateResponse } from '@corpo-lingo/shared';

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