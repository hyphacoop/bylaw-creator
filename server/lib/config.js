// Central place for reading environment configuration.
// Loads .env when present; in Docker env vars can also be injected directly.
require('dotenv').config()

const DEFAULT_OLLAMA_URL = 'https://roo.ai.hypha.coop'

function bool(value, fallback = false) {
  if (value === undefined || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

const config = {
  appPassword: process.env.APP_PASSWORD || '',
  sessionSecret: process.env.SESSION_SECRET || '',
  cookieSecure: bool(process.env.COOKIE_SECURE, false),
  ollamaUrl: process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL,
  ollamaUsername: process.env.OLLAMA_USERNAME || '',
  ollamaPassword: process.env.OLLAMA_PASSWORD || '',
  // Maximum tokens the model may generate per request
  ollamaNumPredict: parseInt(process.env.OLLAMA_NUM_PREDICT || '12000', 10),
  // Context window size; leave unset to use the model/server default
  ollamaNumCtx: process.env.OLLAMA_NUM_CTX ? parseInt(process.env.OLLAMA_NUM_CTX, 10) : undefined,
  // Let reasoning models "think" before answering. Off by default: thinking tokens
  // count against the output limit and can crowd out the bylaws themselves.
  ollamaThink: bool(process.env.OLLAMA_THINK, false),
  frontendUrl: process.env.FRONTEND_URL || '',
  port: parseInt(process.env.PORT || '4000', 10),
}

module.exports = config
