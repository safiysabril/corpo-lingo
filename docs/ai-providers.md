# AI providers

The translation engine is **pluggable**. The active provider is chosen by the
`AI_PROVIDER` env var, with an optional `FALLBACK_PROVIDER` used only on rate-limit
errors.

## The interface

Every provider implements `TranslationService`
([`services/types.ts`](../apps/backend/src/services/types.ts)):

```ts
interface TranslationService {
  translateText(
    text: string,
    mode: TranslationMode,
    formality: FormalityLevel,
  ): Promise<TranslationResult>;
}

interface TranslationResult {
  translatedText: string;
  usage: Record<string, number> | null;  // token usage if the provider reports it
  model: string;                          // model id actually used
}
```

Implementations: `groq.service.ts` (default), `openai.service.ts`,
`gemini.service.ts`, `ollama.service.ts`.

## Selection & fallback ([`ai.factory.ts`](../apps/backend/src/services/ai.factory.ts))

```
getTranslationService()      → providers[AI_PROVIDER]  (throws if unknown)
translateWithFallback(...)   → primary.translateText()
                               └─ on a 429 / rate-limit error AND a FALLBACK_PROVIDER
                                  is set → fallback.translateText()
```

- `translateWithFallback` only falls back when `isRateLimitError()` is true
  (HTTP 429, or a message matching `rate limit` / `429` / `quota exceeded`). Any
  other error is re-thrown and handled by the central error handler.
- If `FALLBACK_PROVIDER` is empty, there is no fallback.

## Configuration

| Provider | Env vars | Default model |
|----------|----------|---------------|
| `groq` *(default)* | `GROQ_API_KEY`, `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL` | `gpt-4o-mini` |
| `gemini` | `GEMINI_API_KEY`, `GEMINI_MODEL` | `gemini-2.0-flash` |
| `ollama` | `OLLAMA_HOST`, `OLLAMA_MODEL` | `llama3.2` (local, no key) |

```env
AI_PROVIDER=groq
FALLBACK_PROVIDER=ollama   # optional; used only on 429s
GROQ_API_KEY=gsk_...
```

Clients are created **lazily** — e.g. the Groq client is only constructed on the
first translate call, so the app still boots (and tests run) without a key set. A
missing key surfaces as a `503 "Translation service is not configured."` at request
time, not at startup.

## Prompt building ([`utils/promptBuilder.ts`](../apps/backend/src/utils/promptBuilder.ts))

- `buildSystemPrompt(mode, formality)` — assembles a system prompt with general
  rules (preserve meaning, no new info, avoid buzzwords) plus mode-specific and
  formality-specific rule blocks.
- `buildUserMessage(text)` — wraps the user's text.
- Temperature scales with formality (`low` 0.2 → `high` 0.4) — higher formality is
  slightly more deliberate.

### Modes & formality (`packages/shared/src/constants.ts`)

| Mode | Output style |
|------|--------------|
| `email` | Greeting + closing, conversational-professional |
| `documentation` | Instructional/descriptive, concise, no chit-chat |
| `formal` | Neutral professional tone, no greeting/closing |

| Formality | Effect |
|-----------|--------|
| `low` | Light polish, minimal changes |
| `medium` | Clearly professional, smooth phrasing |
| `high` | Highly formal, structured, refined (still natural) |

## Adding a new provider

1. Create `services/<name>.service.ts` exporting a default object that satisfies
   `TranslationService` (mirror `groq.service.ts`: lazy client, read
   `<NAME>_MODEL`, build prompts via `promptBuilder`, return a `TranslationResult`).
2. Register it in `ai.factory.ts`:
   ```ts
   const providers = { groq, openai, gemini, ollama, <name> };
   ```
3. Add its env vars to `.env.example` and [deployment.md](deployment.md).
4. Set `AI_PROVIDER=<name>` to activate.

## Caching note

Translations are cached in Redis by `SHA-256(text|mode|formality)` **before** the
provider is considered — identical inputs never re-hit the model, regardless of
provider. The cache is provider-agnostic, so switching `AI_PROVIDER` does not
invalidate previously cached results. See [backend.md](backend.md#caching).
