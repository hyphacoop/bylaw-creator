// Minimal client for the Ollama /api/generate endpoint.
const config = require('./config')

// OLLAMA_URL may be a base URL (http://host:11434) or a full /api/generate URL.
const BASE_URL = config.ollamaUrl.replace(/\/+$/, '').replace(/\/api\/generate$/, '')
const generateUrl = () => `${BASE_URL}/api/generate`

// Models that rejected the "think" option, so we stop sending it to them
const noThinkModels = new Set()

function authHeaders() {
  if (!config.ollamaUsername) return {}
  const token = Buffer.from(`${config.ollamaUsername}:${config.ollamaPassword}`).toString('base64')
  return { Authorization: `Basic ${token}` }
}

async function postGenerate(body) {
  const response = await fetch(generateUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  if (response.ok) return { ok: true, data: await response.json() }
  let detail = ''
  try {
    detail = (await response.text()).slice(0, 500)
  } catch {}
  return { ok: false, status: response.status, statusText: response.statusText, detail }
}

// Generates text and returns { text, truncated, tokens }.
// `truncated` is true when the model stopped because it hit the output limit.
async function generate({ model, prompt, maxTokens = config.ollamaNumPredict }) {
  if (!model) throw new Error('No model specified')
  if (!prompt) throw new Error('No prompt provided')

  const options = { num_predict: maxTokens }
  if (config.ollamaNumCtx) options.num_ctx = config.ollamaNumCtx
  const body = { model, prompt, stream: false, options }
  if (!noThinkModels.has(model)) body.think = config.ollamaThink

  let result = await postGenerate(body)

  // Older Ollama versions or some models reject the "think" option; retry without it
  // and remember the model so later jobs skip the failed attempt.
  if (!result.ok && 'think' in body && result.status === 400 && /think/i.test(result.detail)) {
    console.warn(`⚠️  ${model} rejected the "think" option; omitting it from now on`)
    noThinkModels.add(model)
    delete body.think
    result = await postGenerate(body)
  }

  if (!result.ok) {
    const { status, statusText, detail } = result
    throw new Error(`Ollama API error: ${status} ${statusText}${detail ? ` - ${detail}` : ''}`)
  }

  const { data } = result
  return {
    text: data.response || '',
    truncated: data.done_reason === 'length',
    tokens: data.eval_count,
  }
}

// Lightweight reachability check: GET /api/version (also verifies credentials)
async function version({ timeoutMs = 5000 } = {}) {
  const response = await fetch(`${BASE_URL}/api/version`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`Ollama responded ${response.status} ${response.statusText}`)
  const data = await response.json()
  return data.version
}

module.exports = { generate, generateUrl, version }
