require('dotenv').config()
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const crypto = require('crypto')
const session = require('express-session')

const app = express()

// Add session middleware for authentication
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secure-session-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Middleware to parse JSON and form data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const cors = require('cors')
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Function to decrypt API key if it's encrypted
function getClaudeApiKey(password = null) {
  const apiKey = process.env.CLAUDE_API_KEY
  const encryptedKey = process.env.CLAUDE_API_KEY_ENCRYPTED
  
  if (encryptedKey && password) {
    try {
      const parts = encryptedKey.split(':')
      if (parts.length !== 3) return null
      
      const key = crypto.scryptSync(password, 'salt', 32)
      const iv = Buffer.from(parts[0], 'hex')
      const authTag = Buffer.from(parts[1], 'hex')
      const encrypted = parts[2]
      
      const decipher = crypto.createDecipherGCM('aes-256-gcm', key, iv)
      decipher.setAuthTag(authTag)
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch (error) {
      console.error('Failed to decrypt API key')
      return null
    }
  }
  
  return apiKey
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.authenticated) {
    next()
  } else {
    res.status(401).json({ error: 'Authentication required' })
  }
}

// Login endpoint
app.post('/auth/login', (req, res) => {
  const { password } = req.body
  const correctPassword = process.env.APP_PASSWORD
  
  if (!correctPassword) {
    return res.status(500).json({ error: 'No password configured' })
  }
  
  if (password === correctPassword) {
    req.session.authenticated = true
    req.session.userPassword = password // Store for API key decryption if needed
    res.json({ success: true, message: 'Authenticated successfully' })
  } else {
    res.status(401).json({ error: 'Invalid password' })
  }
})

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  req.session.destroy()
  res.json({ success: true, message: 'Logged out successfully' })
})

// Check auth status
app.get('/auth/status', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated })
})

console.log('🔑 CLAUDE_API_KEY configured:', !!process.env.CLAUDE_API_KEY)
console.log('🔐 Encrypted key configured:', !!process.env.CLAUDE_API_KEY_ENCRYPTED)
console.log('🔒 Password protection:', !!process.env.APP_PASSWORD)

// Protected Claude API proxy - custom implementation
app.post('/anthropic/messages', requireAuth, async (req, res) => {
  try {
    console.log('🚀 Received request to /anthropic/messages')
    
    // Get API key (decrypt if needed)
    const apiKey = getClaudeApiKey(req.session.userPassword)
    if (!apiKey) {
      console.error('❌ No API key available')
      return res.status(500).json({ error: 'API key not available' })
    }
    
    console.log('✅ API key configured, making request to Claude API')
    
    // Make request to Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(req.body)
    })
    
    console.log('📥 Claude API response:', response.status, response.statusText)
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Claude API error:', data)
      return res.status(response.status).json(data)
    }
    
    console.log('✅ Success! Returning response to client')
    res.json(data)
    
  } catch (error) {
    console.error('💥 Proxy error:', error.message)
    res.status(502).json({ error: 'proxy failed', detail: error.message })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🔁 proxy running on port ${PORT}`)
  console.log('🔐 Authentication:', process.env.APP_PASSWORD ? 'ENABLED' : 'DISABLED')
})
