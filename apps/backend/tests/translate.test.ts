import request from 'supertest';
import app from '../src/app';

// Mock the factory so tests never touch a real AI API. The controller calls
// translateWithFallback(); getTranslationService is kept for completeness.
// (The object is defined inside the factory because jest hoists jest.mock above
// the imports, so it can't reference out-of-scope variables.)
jest.mock('../src/services/ai.factory', () => {
  const result = {
    translatedText: 'We would like to leverage this opportunity to synergize our efforts.',
    usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
    model: 'llama-3.3-70b-versatile',
  };
  return {
    getTranslationService: () => ({
      translateText: jest.fn().mockResolvedValue(result),
    }),
    translateWithFallback: jest.fn().mockResolvedValue(result),
  };
});

describe('GET /health', () => {
  it('returns 200 and status message', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/v1/translate/options', () => {
  it('returns modes and formality levels', async () => {
    const res = await request(app).get('/api/v1/translate/options');
    expect(res.status).toBe(200);
    expect(res.body.data.modes).toEqual(['email', 'documentation', 'formal']);
    expect(res.body.data.formality).toEqual(['low', 'medium', 'high']);
  });
});

describe('POST /api/v1/translate', () => {
  const validPayload = {
    text: "Hey, can we chat about the project? It's kind of a mess right now.",
    mode: 'email',
    formality: 'medium',
  };

  it('translates text and returns provider info in meta', async () => {
    const res = await request(app).post('/api/v1/translate').send(validPayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.translated).toBeDefined();
    expect(res.body.data.original).toBe(validPayload.text);
    expect(res.body.meta.provider).toBeDefined();
    expect(res.body.meta.model).toBeDefined();
  });

  it('returns 422 when text is missing', async () => {
    const res = await request(app)
      .post('/api/v1/translate')
      .send({ mode: 'email', formality: 'low' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for invalid mode', async () => {
    const res = await request(app)
      .post('/api/v1/translate')
      .send({ ...validPayload, mode: 'tweet' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid formality', async () => {
    const res = await request(app)
      .post('/api/v1/translate')
      .send({ ...validPayload, formality: 'extreme' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for text that is too short', async () => {
    const res = await request(app)
      .post('/api/v1/translate')
      .send({ ...validPayload, text: 'hi' });
    expect(res.status).toBe(422);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.status).toBe(404);
  });
});
