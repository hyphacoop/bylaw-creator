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

// Function to get Ollama credentials
function getOllamaCredentials(password = null) {
  const username = process.env.OLLAMA_USERNAME
  const token = process.env.OLLAMA_PASSWORD
  const encryptedToken = process.env.OLLAMA_PASSWORD_ENCRYPTED
  
  if (encryptedToken && password) {
    try {
      const parts = encryptedToken.split(':')
      if (parts.length !== 3) return null
      
      const key = crypto.scryptSync(password, 'salt', 32)
      const iv = Buffer.from(parts[0], 'hex')
      const authTag = Buffer.from(parts[1], 'hex')
      const encrypted = parts[2]
      
      const decipher = crypto.createDecipherGCM('aes-256-gcm', key, iv)
      decipher.setAuthTag(authTag)
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return { username, token: decrypted }
    } catch (error) {
      console.error('Failed to decrypt Ollama token')
      return null
    }
  }
  
  return { username, token }
}

// Convert Claude-style messages to Ollama prompt format
function convertMessagesToPrompt(messages) {
  if (!messages || !Array.isArray(messages)) {
    return ''
  }
  
  return messages.map(msg => {
    if (msg.role === 'user') {
      return msg.content
    } else if (msg.role === 'assistant') {
      return `Assistant: ${msg.content}`
    }
    return msg.content
  }).join('\n\n')
}

// Convert Ollama response to Claude-style format
function convertOllamaResponse(ollamaResponse) {
  return {
    id: `ollama_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: ollamaResponse.response || ''
      }
    ],
    model: ollamaResponse.model || 'unknown',
    stop_reason: ollamaResponse.done ? 'end_turn' : null,
    usage: {
      input_tokens: ollamaResponse.prompt_eval_count || 0,
      output_tokens: ollamaResponse.eval_count || 0
    }
  }
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
console.log('🦙 OLLAMA_URL configured:', process.env.OLLAMA_URL || 'Using default (roo.ai.hypha.coop)')
console.log('🦙 OLLAMA_USERNAME configured:', !!process.env.OLLAMA_USERNAME)
console.log('🦙 OLLAMA_PASSWORD configured:', !!process.env.OLLAMA_PASSWORD)
console.log('🔐 Encrypted Ollama password configured:', !!process.env.OLLAMA_PASSWORD_ENCRYPTED)
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

// Protected Ollama API proxy
app.post('/ollama/generate', requireAuth, async (req, res) => {
  try {
    console.log('🦙 Received request to /ollama/generate')
    
    // Get Ollama credentials (decrypt if needed)
    const credentials = getOllamaCredentials(req.session.userPassword)
    if (!credentials || !credentials.username || !credentials.token) {
      console.error('❌ No Ollama credentials available')
      return res.status(500).json({ error: 'Ollama credentials not available' })
    }
    
    console.log('✅ Ollama credentials configured, making request to Ollama API')
    
    // Convert Claude-style request to Ollama format
    const { model, messages, max_tokens } = req.body
    
    const prompt = convertMessagesToPrompt(messages)
    
    const ollamaPayload = {
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        num_predict: max_tokens || 5000
      }
    }

    // Create basic auth header
    const authHeader = Buffer.from(`${credentials.username}:${credentials.token}`).toString('base64')
    
    // Make request to Ollama API
    const ollamaUrl = process.env.OLLAMA_URL || 'https://roo.ai.hypha.coop/api/generate'
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ollamaPayload)
    })
    
    console.log('📥 Ollama API response:', response.status, response.statusText)
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Ollama API error:', data)
      return res.status(response.status).json(data)
    }
    
    // Convert Ollama response to Claude-style format
    const claudeStyleResponse = convertOllamaResponse(data)
    
    console.log('✅ Success! Returning converted response to client')
    res.json(claudeStyleResponse)
    
  } catch (error) {
    console.error('💥 Ollama proxy error:', error.message)
    res.status(502).json({ error: 'Ollama proxy failed', detail: error.message })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🔁 proxy running on port ${PORT}`)
  console.log('🔐 Authentication:', process.env.APP_PASSWORD ? 'ENABLED' : 'DISABLED')
})
