# Sahayak AI service

This is the separate AI service used by the portal's existing
`POST /api/sahayak/chat` integration. It listens on `HOST`/`PORT` and
forwards each request to OpenRouter's OpenAI-compatible chat-completions API.

## Setup

```powershell
cd sahayak-service
npm install
Copy-Item .env.example .env
```

Set `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, and `OPENROUTER_MODEL` in
`.env`. Do not commit `.env`.

## Run

```powershell
npm start
```

For local development, the portal backend can use:

```env
SAHAYAK_API_URL=http://localhost:8000
```

The service exposes `POST /chat` with `{ "problem": "...", "language": "en" }`
or `"hi"`, and returns the structured JSON consumed by
`components/sahayak-chat.tsx`. If the provider is not configured or fails, the
service returns an error; it never fabricates a response.
