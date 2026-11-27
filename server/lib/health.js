// Health checks for monitoring. Both endpoints are unauthenticated, so they
// report status only, never configuration values or credentials.
const config = require('./config')
const ollama = require('./ollama')
const store = require('./jobStore')
const { version } = require('../../package.json')

const startedAt = Date.now()
const READY_CACHE_MS = 5000
let readyCache = null

// Liveness: is the process up? Cheap, no external calls.
function liveness() {
  return {
    status: 200,
    body: {
      status: 'ok',
      version,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      jobs: store.stats(),
    },
  }
}

// Readiness: can the app actually serve requests (config present, Ollama reachable)?
// Results are cached briefly so frequent probes don't hammer Ollama.
async function readiness() {
  if (readyCache && Date.now() - readyCache.at < READY_CACHE_MS) return readyCache.result

  const checks = {
    config: config.appPassword
      ? { ok: true }
      : { ok: false, error: 'APP_PASSWORD is not set' },
  }

  const start = Date.now()
  try {
    const ollamaVersion = await ollama.version()
    checks.ollama = { ok: true, latencyMs: Date.now() - start, version: ollamaVersion }
  } catch (error) {
    // fetch() reports network failures as "fetch failed"; the cause has the useful code
    const message =
      error.name === 'TimeoutError' ? 'timed out' : (error.cause && error.cause.code) || error.message
    checks.ollama = { ok: false, latencyMs: Date.now() - start, error: message }
  }

  const ok = Object.values(checks).every((check) => check.ok)
  const result = {
    status: ok ? 200 : 503,
    body: { status: ok ? 'ok' : 'error', version, checks },
  }
  readyCache = { at: Date.now(), result }
  return result
}

module.exports = { liveness, readiness }
