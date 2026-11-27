// Stateless, HMAC-signed session cookie used by the Express server.
const crypto = require('crypto')
const { parse, serialize } = require('cookie')
const config = require('./config')

const COOKIE_NAME = 'auth-session'
const MAX_AGE_SECONDS = 24 * 60 * 60

let warnedAboutSecret = false
function getSecret() {
  if (config.sessionSecret) return config.sessionSecret
  if (!warnedAboutSecret) {
    console.warn('⚠️  SESSION_SECRET not set; deriving one from APP_PASSWORD. Set SESSION_SECRET in production.')
    warnedAboutSecret = true
  }
  return crypto.createHash('sha256').update(`bylaw-creator:${config.appPassword}`).digest('hex')
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url')
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

function createToken() {
  const payload = Buffer.from(JSON.stringify({ iat: Date.now() })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return false
  try {
    const { iat } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return typeof iat === 'number' && Date.now() - iat < MAX_AGE_SECONDS * 1000
  } catch {
    return false
  }
}

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge,
  }
}

function isAuthenticated(req) {
  const cookies = parse(req.headers.cookie || '')
  return verifyToken(cookies[COOKIE_NAME])
}

// Returns a { status, body, cookie? } result (see server/lib/http.js).
function login(password) {
  if (!config.appPassword) {
    return { status: 500, body: { error: 'No password configured' } }
  }
  if (typeof password !== 'string' || !safeEqual(password, config.appPassword)) {
    return { status: 401, body: { error: 'Invalid password' } }
  }
  return {
    status: 200,
    body: { success: true, message: 'Authenticated successfully' },
    cookie: serialize(COOKIE_NAME, createToken(), cookieOptions(MAX_AGE_SECONDS)),
  }
}

function logout() {
  return {
    status: 200,
    body: { success: true, message: 'Logged out successfully' },
    cookie: serialize(COOKIE_NAME, '', cookieOptions(0)),
  }
}

module.exports = { isAuthenticated, login, logout }
