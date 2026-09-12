# Sahayak AI service

This is the separate AI service used by the portal's existing
`POST /api/sahayak/chat` integration. It listens on `127.0.0.1:8000` and
forwards each request to an OpenAI-compatible chat-completions provider.

## Setup

```powershell
cd sahayak-service
npm install
Copy-Item .env.example .env
```

Set `OPENAI_API_KEY` in `.env`. The service supports OpenAI and compatible
providers by changing `OPENAI_BASE_URL` and `OPENAI_MODEL`. Do not commit `.env`.

## Run

```powershell
npm start
```

The portal backend should use its existing default:

```env
SAHAYAK_API_URL=http://127.0.0.1:8000
```

The service exposes `POST /chat` with `{ "problem": "...", "language": "en" }`
or `"hi"`, and returns the structured JSON consumed by
`components/sahayak-chat.tsx`. If the provider is not configured or fails, the
service returns an error; it never fabricates a response.
