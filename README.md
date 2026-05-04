# Corpo Lingo

A full-stack application that translates casual, informal text into professional corporate language. Perfect for transforming everyday communication into polished business speak!

## 📋 Project Overview

**Corpo Lingo** is a monorepo project that leverages AI to convert informal text into various corporate communication styles. It supports multiple translation modes (email, documentation, formal) and formality levels (low, medium, high), with flexible AI provider integration.

**Authors**: Zana & Safiy

## 🏗️ Architecture

This is a **monorepo** managed with **pnpm workspaces** and **Nx**, containing:

- **Frontend**: React + TypeScript + Vite - User-facing web interface
- **Backend**: Express.js + TypeScript - REST API with AI translation services
- **Shared**: Utility package with common types and constants

### Directory Structure

```
corpo-lingo/
├── apps/
│   ├── backend/          # Express API server
│   │   └── src/
│   │       ├── controllers/    # Request handlers
│   │       ├── middleware/     # Express middleware (validation, error handling)
│   │       ├── routes/         # Route definitions
│   │       ├── services/       # AI provider implementations (Groq, OpenAI, Ollama)
│   │       ├── scripts/        # Utility scripts (dataset generation)
│   │       └── utils/          # Helper functions (prompts, constants)
│   └── frontend/         # React web app
│       └── src/
│           ├── components/     # React components (UI, Translator)
│           ├── pages/         # Page components
│           ├── api/           # API client
│           └── lib/           # Utilities
├── packages/
│   └── shared/           # Shared types and constants
│       └── src/
│           ├── types.ts       # TypeScript interfaces
│           └── constants.ts   # Translation modes and formality levels
├── nx.json               # Nx workspace configuration
├── pnpm-workspace.yaml   # pnpm monorepo configuration
└── package.json          # Root package with shared scripts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm
- **AI Provider API Key** (Groq, OpenAI, or local Ollama)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd corpo-lingo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create `.env` files for each app:
   
   `apps/backend/.env`:
   ```env
   PORT=3000
   AI_PROVIDER=groq
   GROQ_API_KEY=your_groq_api_key
   # or for OpenAI:
   # AI_PROVIDER=openai
   # OPENAI_API_KEY=your_openai_api_key
   # or for local Ollama:
   # AI_PROVIDER=ollama
   # OLLAMA_BASE_URL=http://localhost:11434
   ```

4. **Run development servers**
   ```bash
   pnpm dev
   ```
   
   This starts:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

## 📦 Packages Overview

### Backend (`apps/backend`)

Express.js REST API server with pluggable AI providers.

**Key Features:**
- Translation endpoint with support for multiple modes and formality levels
- Pluggable AI service architecture (Groq, OpenAI, Ollama)
- Input validation using express-validator
- Error handling middleware
- CORS and security headers (Helmet)
- Rate limiting
- Request logging (Morgan)
- Jest test suite

**Main Endpoint:**
- `POST /api/translate` - Translate text to corporate language
  ```json
  {
    "text": "hey, can you help me out?",
    "mode": "email",
    "formality": "high"
  }
  ```

**Scripts:**
- `pnpm start` - Run production server
- `pnpm dev` - Run development server with hot reload
- `pnpm test` - Run Jest tests
- `pnpm test:watch` - Run tests in watch mode

**Technologies:**
- Express.js 5.x
- TypeScript
- Groq SDK (primary AI provider)
- Jest & Supertest (testing)
- Morgan, Helmet, CORS (middleware)

### Frontend (`apps/frontend`)

Modern React web application with Vite and TypeScript.

**Key Features:**
- Real-time translation UI with React Query
- Multiple translation modes and formality levels
- Dark/light theme support (next-themes)
- Modern UI components (Radix UI, shadcn)
- Toast notifications (Sonner)
- Responsive design with Tailwind CSS
- ESLint for code quality

**Components:**
- `Translator.tsx` - Main translation interface
- UI components (Button, Card, Tooltip, etc.)

**Scripts:**
- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build

**Technologies:**
- React 19
- TypeScript
- Vite
- React Query (data fetching)
- Tailwind CSS (styling)
- Radix UI & shadcn (UI components)
- React Router

### Shared (`packages/shared`)

Shared TypeScript types and constants used by both frontend and backend.

**Exports:**
- `TranslatePayload` - Request structure
- `TranslateResponse` - Response structure
- `TRANSLATION_MODES` - Supported modes (email, documentation, formal)
- `FORMALITY_LEVELS` - Supported levels (low, medium, high)
- Helper descriptions for UI/documentation

## 🔧 Development Workflow

### Available Commands

At the root level:

```bash
# Run all dev servers in parallel
pnpm dev

# Run Nx dev for all packages
pnpm nx-dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run linting
pnpm lint
```

### Adding New Features

1. **Shared types**: Update `packages/shared/src/types.ts`
2. **Backend logic**: Add to `apps/backend/src/services` or `controllers`
3. **Frontend UI**: Add components to `apps/frontend/src/components`
4. **Environment config**: Update `.env` files

### Testing

```bash
# Backend tests only
cd apps/backend
pnpm test

# With coverage
pnpm test -- --coverage
```

## 🤖 AI Providers

The backend supports multiple AI providers through a factory pattern:

### Supported Providers

1. **Groq** (Recommended - Fast & Free Tier Available)
   - Environment: `GROQ_API_KEY`
   - Provider: `groq`

2. **OpenAI**
   - Environment: `OPENAI_API_KEY`
   - Provider: `openai`

3. **Ollama** (Local)
   - Environment: `OLLAMA_BASE_URL`
   - Provider: `ollama`
   - Default: `http://localhost:11434`

### Service Architecture

Each AI provider is implemented as a service with a common interface (see `apps/backend/src/services/types.ts`). The factory pattern (`ai.factory.ts`) instantiates the appropriate service based on environment configuration.

## 📊 Translation Modes

### Email
Optimized for professional business email communication - formal but friendly.

### Documentation
Suitable for technical documentation and internal reports - precise and detailed.

### Formal
For formal corporate communications, memos, and presentations - highly structured.

## 📈 Formality Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| **Low** | Light improvement with minimal changes | Casual to semi-professional |
| **Medium** | Professional and polite with smooth phrasing | General business communication |
| **High** | Highly formal, structured, refined language | Executive communications, formal docs |

## 🔐 Security Features

- **CORS**: Configured for safe cross-origin requests
- **Helmet**: HTTP headers security
- **Rate Limiting**: Express-rate-limit protection
- **Input Validation**: express-validator on all inputs
- **Error Handling**: Middleware-based error catching and sanitization

## 📝 Environment Variables

### Backend (.env)

```env
# Server
PORT=3000

# AI Provider Selection
AI_PROVIDER=groq

# Groq Configuration
GROQ_API_KEY=your_api_key_here

# OpenAI Configuration (alternative)
# OPENAI_API_KEY=your_api_key_here

# Ollama Configuration (local)
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama2

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing

```bash
# Run backend tests
cd apps/backend
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test -- --coverage
```

## 🎨 Styling & UI

The frontend uses:
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible component primitives
- **shadcn/ui** for pre-built, customizable components
- **Lucide Icons** for icons
- **Sonner** for toast notifications
- **next-themes** for theme management

## 📚 Project Dependencies

### Root Level
- **Nx** 22.6.5 - Monorepo management
- **TypeScript** 6.0.3 - Type safety
- **Node Types** 25.6.0 - Node.js type definitions

### Backend
- express@5.2.1
- groq-sdk@1.1.2
- express-validator@7.3.2
- jest@30.3.0
- tsx@4.21.0 (TypeScript execution)

### Frontend
- react@19.2.5
- vite@8.0.10
- react-query@5.100.6
- tailwindcss@4.2.4
- eslint@10.2.1

## 🚀 Deployment

### Frontend
```bash
cd apps/frontend
pnpm build
# Output: dist/ directory ready for static hosting
```

### Backend
```bash
cd apps/backend
pnpm start
# Server runs on configured PORT
```

## 📖 API Documentation

### POST /api/translate

**Request:**
```json
{
  "text": "yo, what's up?",
  "mode": "email",
  "formality": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "yo, what's up?",
    "translated": "Good day. I hope this message finds you well.",
    "mode": "email",
    "formality": "high"
  },
  "meta": {
    "provider": "groq",
    "model": "mixtral-8x7b-32768",
    "usage": {
      "prompt_tokens": 150,
      "completion_tokens": 25
    },
    "timestamp": "2024-05-04T13:38:10.314Z"
  }
}
```

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Change port in .env or kill the process
lsof -i :3000
kill -9 <PID>
```

**Missing dependencies:**
```bash
pnpm install
```

**Environment variables not loading:**
- Ensure `.env` files are in the correct app directory
- Restart dev server after updating `.env`

**AI provider connection issues:**
- Verify API key is correct
- Check API key permissions and quotas
- For Ollama, ensure it's running on the configured URL

## 📄 License

UNLICENSED - Private project

## 🤝 Contributing

Contributions from team members welcome! Please:
1. Follow the existing code structure
2. Add tests for new features
3. Update shared types if needed
4. Test across frontend and backend

---

**Happy translating! 🎉**
