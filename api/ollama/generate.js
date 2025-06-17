import { parse } from 'cookie'
import crypto from 'crypto'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
}

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

function requireAuth(req) {
  try {
    const cookies = parse(req.headers.cookie || '')
    const sessionToken = cookies['auth-session']
    
    if (!sessionToken) {
      return { authenticated: false, error: 'No session token' }
    }

    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
    
    // Check if session is expired (24 hours)
    const isExpired = Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000
    
    if (isExpired || !sessionData.authenticated) {
      return { authenticated: false, error: 'Session expired' }
    }

    return { authenticated: true, password: sessionData.password }
  } catch (error) {
    return { authenticated: false, error: 'Invalid session' }
  }
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

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
      .setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods'])
      .setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers'])
      .setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials'])
      .end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Check authentication
  const auth = requireAuth(req)
  if (!auth.authenticated) {
    return res.status(401).json({ error: 'Authentication required', detail: auth.error })
  }

  // Get Ollama credentials (decrypt if needed)
  const credentials = getOllamaCredentials(auth.password)
  if (!credentials || !credentials.username || !credentials.token) {
    return res.status(500).json({ error: 'Ollama credentials not available' })
  }

  try {
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
    
    // Forward the request to Ollama API
    const ollamaUrl = process.env.OLLAMA_URL || 'https://roo.ai.hypha.coop/api/generate'
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ollamaPayload)
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    // Convert Ollama response to Claude-style format
    const claudeStyleResponse = convertOllamaResponse(data)

    return res.status(200).json(claudeStyleResponse)
  } catch (error) {
    console.error('Ollama API proxy error:', error)
    return res.status(502).json({ 
      error: 'Proxy failed', 
      detail: error.message 
    })
  }
} 