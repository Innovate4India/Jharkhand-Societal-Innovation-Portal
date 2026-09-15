import 'dotenv/config';
import http from 'node:http';

const host = process.env.HOST || '0.0.0.0';
const port = Number.parseInt(process.env.PORT || '8000', 10);
const apiKey = process.env.OPENROUTER_API_KEY;
const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
const model = process.env.OPENROUTER_MODEL || 'minimax/minimax-m3';

const responseShape = {
  message: 'string, only for a brief clarification or out-of-scope response',
  understanding: { summary: 'string' },
  severity: 'low | medium | high | critical',
  can_solve_myself: 'boolean',
  solution_info: {
    steps: ['string'],
    tools_materials: ['string'],
    estimated_time: 'string',
    estimated_cost: 'string'
  },
  safety_guidance: {
    precautions: ['string'],
    when_to_stop: 'string'
  },
  escalation: {
    required: 'boolean',
    contact: 'string',
    reason: 'string'
  },
  prevention: ['string'],
  helplines: [{ name: 'string', number: 'string', purpose: 'string' }]
};

const systemPrompt = `You are Sahayak, a practical guidance assistant for the Jharkhand Societal Innovation Portal.
You support Citizen, Government, University, and Industry users. Citizens submit and track problems; Government verifies, prioritizes, assigns, and monitors; University accepts, develops, tests, and deploys; Industry sponsors projects and provides optional expertise. Explain how industry can sponsor eligible university projects, what happens after funding, and how to provide technical support.
Give safe, realistic, locally useful guidance about civic and community problems. Do not claim to have contacted authorities or verified live information.
The requested language is supplied by the user. Return all user-facing text in that language (English for "en", Hindi in Devanagari for "hi").
Return ONLY valid JSON matching this shape, with no Markdown fences:
${JSON.stringify(responseShape)}
Use empty arrays or empty strings when a field does not apply. For urgent safety risks, set severity to "critical", can_solve_myself to false, and clearly explain when to seek professional or emergency help.`;

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function parseJsonContent(content) {
  const withoutFence = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(withoutFence);
}

async function generateGuidance(problem, language) {
  if (!apiKey || apiKey === 'replace_with_your_provider_api_key') {
    const error = new Error('Sahayak requires OPENROUTER_API_KEY to generate real AI responses');
    error.statusCode = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const providerResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'Jharkhand Societal Innovation Portal Sahayak'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify({ problem, language }) }
        ]
      }),
      signal: controller.signal
    });
    const providerBody = await providerResponse.json();
    if (!providerResponse.ok) {
      const error = new Error(providerBody.error?.message || 'AI provider request failed');
      error.statusCode = 502;
      throw error;
    }

    const content = providerBody.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      const error = new Error('AI provider returned no response content');
      error.statusCode = 502;
      throw error;
    }
    return parseJsonContent(content);
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    return sendJson(response, 200, {
      status: 'ok',
      provider: 'openrouter',
      model,
      providerConfigured: Boolean(apiKey && apiKey !== 'replace_with_your_provider_api_key')
    });
  }
  if (request.method !== 'POST' || request.url !== '/chat') {
    return sendJson(response, 404, { detail: 'Not found' });
  }

  let rawBody = '';
  for await (const chunk of request) rawBody += chunk;
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return sendJson(response, 400, { detail: 'Request body must be valid JSON' });
  }

  const problem = typeof body.problem === 'string' ? body.problem.trim() : '';
  const language = body.language === 'hi' ? 'hi' : body.language === 'en' ? 'en' : null;
  if (!problem) return sendJson(response, 400, { detail: 'Problem text cannot be empty' });
  if (!language) return sendJson(response, 400, { detail: 'Language must be en or hi' });

  try {
    return sendJson(response, 200, await generateGuidance(problem, language));
  } catch (error) {
    if (error.name === 'AbortError') return sendJson(response, 504, { detail: 'AI provider request timed out' });
    console.error(`Sahayak error: ${error.message}`);
    return sendJson(response, error.statusCode || 500, { detail: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Sahayak service listening on http://${host}:${port}`);
  console.log(`AI provider: ${baseUrl} (${model})`);
});
