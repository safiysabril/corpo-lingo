const BASE_URL = 'http://localhost:3000/api/v1';

export async function translateText({ text, mode, degree }) {
  const payload = { text, mode, degree };

  console.log('API Request Body:', payload);

  const res = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log('API Response:', data);

  if (!res.ok) {
    throw new Error(data.error || 'Failed to translate');
  }

  return data;
}