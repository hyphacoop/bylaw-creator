// Express server for local development and Docker.
// Serves the API under /api and, when a production build exists, the React app.
const path = require('path')
const fs = require('fs')
const express = require('express')
const config = require('./lib/config')
const auth = require('./lib/auth')
const jobs = require('./lib/jobs')
const ollama = require('./lib/ollama')
const health = require('./lib/health')
const { send, unauthorized } = require('./lib/http')

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))

// CORS is only needed when the frontend is served from a different origin.
if (config.frontendUrl) {
  const cors = require('cors')
  app.use('/api', cors({ origin: config.frontendUrl, credentials: true }))
}

function requireAuth(req, res, next) {
  if (auth.isAuthenticated(req)) return next()
  send(res, unauthorized)
}

// Monitoring: /api/health = liveness (process up), /api/ready = readiness (Ollama reachable)
const noStore = (res) => res.setHeader('Cache-Control', 'no-store')
app.get('/api/health', (req, res) => {
  noStore(res)
  send(res, health.liveness())
})
app.get('/api/ready', async (req, res, next) => {
  try {
    noStore(res)
    send(res, await health.readiness())
  } catch (err) {
    next(err)
  }
})

app.post('/api/auth/login', (req, res) => send(res, auth.login(req.body && req.body.password)))
app.post('/api/auth/logout', (req, res) => send(res, auth.logout()))
app.get('/api/auth/status', (req, res) => res.json({ authenticated: auth.isAuthenticated(req) }))

app.post('/api/jobs/submit', requireAuth, (req, res) => send(res, jobs.submit(req.body)))
app.get('/api/jobs/status', requireAuth, (req, res) => send(res, jobs.status(req.query.jobId)))

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

// Serve the built React app (production / Docker).
const buildDir = path.join(__dirname, '..', 'build')
const hasBuild = fs.existsSync(path.join(buildDir, 'index.html'))
if (hasBuild) {
  app.use(express.static(buildDir, { index: false, maxAge: '1h' }))
  app.get('*', (req, res) => res.sendFile(path.join(buildDir, 'index.html')))
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err)
  res.status(500).json({ error: 'Internal server error', detail: err.message })
})

app.listen(config.port, () => {
  console.log(`🔁 bylaw-creator server listening on http://localhost:${config.port}`)
  console.log(`🦙 Ollama endpoint: ${ollama.generateUrl()} (basic auth: ${config.ollamaUsername ? 'yes' : 'no'})`)
  console.log(`🔒 Password protection: ${config.appPassword ? 'enabled' : 'NOT CONFIGURED (login will fail)'}`)
  console.log(`🌐 Serving frontend build: ${hasBuild ? 'yes' : 'no (use `npm start` for the dev UI)'}`)
})
