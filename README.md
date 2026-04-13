# 🏢 Corporate Translator API

A Node.js + Express backend that translates casual or informal text into polished corporate language — with 3 modes and 3 degrees of paraphrasing. Powered by OpenAI (with a clean service layer ready for your own model in the future).

---

## Features

- **3 Translation Modes**: `email`, `documentation`, `formal`
- **3 Paraphrasing Degrees**: `few`, `moderate`, `high`
- Input validation with descriptive error messages
- Rate limiting (100 requests / 15 min per IP)
- Security headers via Helmet
- CORS configuration for your React/Vue frontends
- Clean, modular architecture ready to extend (auth, DB, custom model)
- Full test suite with Jest + Supertest

---

## Project Structure

```
corporate-translator/
├── src/
│   ├── app.js                    # Express app setup (middleware, routes)
│   ├── server.js                 # Server entry point
│   ├── routes/
│   │   └── translate.routes.js   # Route definitions
│   ├── controllers/
│   │   └── translate.controller.js
│   ├── services/
│   │   └── openai.service.js     # AI translation logic (swap this for your own model later)
│   ├── middleware/
│   │   ├── validate.js           # Request validation
│   │   ├── errorHandler.js       # Global error handler
│   │   └── notFound.js           # 404 handler
│   └── utils/
│       ├── constants.js          # Modes, degrees, descriptions
│       └── promptBuilder.js      # System prompt generator
├── tests/
│   └── translate.test.js
├── .env.example
└── package.json
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

### 3. Run in development

```bash
npm run dev
```

### 4. Run tests

```bash
npm test
```

---

## API Reference

### Health Check

```
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Corporate Translator API is running.",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

---

### Get Options

```
GET /api/v1/translate/options
```

Returns all valid modes and degrees. Useful for populating frontend dropdowns dynamically.

**Response:**
```json
{
  "success": true,
  "data": {
    "modes": ["email", "documentation", "formal"],
    "degrees": ["few", "moderate", "high"]
  }
}
```

---

### Translate Text

```
POST /api/v1/translate
Content-Type: application/json
```

**Request Body:**

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `text`   | string | ✅       | The text to translate (3–5000 characters) |
| `mode`   | string | ✅       | `email` \| `documentation` \| `formal` |
| `degree` | string | ✅       | `few` \| `moderate` \| `high` |

**Example Request:**
```json
{
  "text": "Hey, the project's kind of a mess. Can we get everyone on the same page asap?",
  "mode": "email",
  "degree": "high"
}
```

**Example Response (200):**
```json
{
  "success": true,
  "data": {
    "original": "Hey, the project's kind of a mess. Can we get everyone on the same page asap?",
    "translated": "I wanted to proactively reach out regarding the current state of our project. It would be greatly beneficial if we could align all stakeholders and establish a unified strategic direction at the earliest opportunity.",
    "mode": "email",
    "degree": "high"
  },
  "meta": {
    "usage": {
      "prompt_tokens": 120,
      "completion_tokens": 45,
      "total_tokens": 165
    },
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

**Validation Error (422):**
```json
{
  "success": false,
  "error": "Validation failed.",
  "details": [
    { "field": "mode", "message": "mode must be one of: email, documentation, formal." }
  ]
}
```

---

## Modes & Degrees Explained

### Modes

| Mode            | Use Case |
|-----------------|----------|
| `email`         | Business email communication |
| `documentation` | Technical docs, internal reports |
| `formal`        | Memos, presentations, executive comms |

### Degrees

| Degree     | Effect |
|------------|--------|
| `few`      | Light polish — keeps the original tone, tightens language |
| `moderate` | Standard corporate vocabulary and professional tone |
| `high`     | Maximum buzzwords, synergy-speak, executive jargon |

---

## Future Roadmap

- **Auth** — JWT-based login, user accounts (PostgreSQL integration ready)
- **History** — Save translation history per user
- **Custom Model** — Swap `openai.service.js` with your own trained model; the service interface is identical
- **Frontend** — React and Vue clients consuming this API

---

## Swapping the AI Model

All AI logic is isolated in `src/services/openai.service.js`. To use your own model:

1. Create `src/services/myModel.service.js` exporting the same `translateText(text, mode, degree)` function.
2. Update the import in `src/controllers/translate.controller.js`.
3. No other files need to change.