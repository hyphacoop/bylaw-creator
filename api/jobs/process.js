import { parse } from 'cookie'
import crypto from 'crypto'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Request',
  'Access-Control-Allow-Credentials': 'true'
}

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
    // Check if this is an internal webhook request
    const isInternal = req.headers['x-internal-request'] === 'true'
    
    if (isInternal) {
      console.log('Internal webhook request detected')
      return { authenticated: true, password: null, isInternal: true }
    }

    // Regular auth check for external requests
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

    return { authenticated: true, password: sessionData.password, isInternal: false }
  } catch (error) {
    return { authenticated: false, error: 'Invalid session' }
  }
}

async function processJobData(jobId, jobData, userPassword) {
  try {
    console.log('Processing job:', jobId, 'with data:', Object.keys(jobData))

    // Update status to processing
    await redis.hset(`job:${jobId}`, {
      status: 'processing',
      updatedAt: Date.now()
    })

    const { formData, payload, isOllamaModel } = jobData

    if (isOllamaModel) {
      console.log('Processing Ollama model:', payload.model)
      
      // Handle Ollama models
      const credentials = getOllamaCredentials(userPassword)
      if (!credentials || !credentials.username || !credentials.token) {
        throw new Error('Ollama credentials not available')
      }

      const authHeader = Buffer.from(`${credentials.username}:${credentials.token}`).toString('base64')
      const ollamaUrl = process.env.OLLAMA_URL || 'https://roo.ai.hypha.coop/api/generate'

      console.log('Calling Ollama API:', ollamaUrl)

      const ollamaResponse = await fetch(ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authHeader}`
        },
        body: JSON.stringify({
          model: payload.model,
          prompt: payload.messages[0].content,
          stream: false,
          options: {
            num_predict: payload.max_tokens || 5000
          }
        })
      })

      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text()
        throw new Error(`Ollama API error: ${ollamaResponse.status} ${ollamaResponse.statusText} - ${errorText}`)
      }

      const ollamaData = await ollamaResponse.json()
      const generatedBylaws = ollamaData.response

      console.log('Ollama response received, length:', generatedBylaws?.length || 0)

      await redis.hset(`job:${jobId}`, {
        status: 'completed',
        result: generatedBylaws,
        completedAt: Date.now()
      })

    } else {
      console.log('Processing Claude model:', payload.model)
      
      // Handle Claude API
      const apiKey = getClaudeApiKey(userPassword)
      if (!apiKey) {
        throw new Error('Claude API key not available')
      }

      console.log('Calling Claude API...')

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Claude API error: ${JSON.stringify(data)}`)
      }

      const textBlocks = data.content?.filter((c) => c.type === 'text') || []
      const bylaws = textBlocks.map((c) => c.text).join('\n\n')

      console.log('Claude response received, length:', bylaws.length)

      await redis.hset(`job:${jobId}`, {
        status: 'completed',
        result: bylaws,
        completedAt: Date.now()
      })
    }

    // Set expiration for 24 hours
    await redis.expire(`job:${jobId}`, 86400)

    console.log('Job completed successfully:', jobId)
    return { success: true }

  } catch (error) {
    console.error('Job processing error:', error)
    
    // Mark job as failed
    await redis.hset(`job:${jobId}`, {
      status: 'failed',
      error: error.message,
      failedAt: Date.now()
    })

    return { success: false, error: error.message }
  }
}

export default async function handler(req, res) {
  console.log('Processing endpoint called:', req.method, req.url, 'User-Agent:', req.headers['user-agent'])
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
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

  const { jobId } = req.body

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' })
  }

  try {
    console.log('Processing job:', jobId)

    // Get job data from Redis
    const jobDataStr = await redis.hget(`job:${jobId}`, 'jobData')
    const userPassword = await redis.hget(`job:${jobId}`, 'userPassword')
    
    if (!jobDataStr) {
      throw new Error('Job data not found')
    }

    const jobData = JSON.parse(jobDataStr)

    // Process the job (this can take a long time - web search, Ollama, etc.)
    const result = await processJobData(jobId, jobData, userPassword)

    if (result.success) {
      return res.status(200).json({ 
        success: true,
        jobId,
        message: 'Job completed successfully'
      })
    } else {
      return res.status(500).json({ 
        error: 'Job processing failed', 
        detail: result.error 
      })
    }

  } catch (error) {
    console.error('Job processing error:', error)
    
    // Mark job as failed
    try {
      await redis.hset(`job:${jobId}`, {
        status: 'failed',
        error: error.message,
        failedAt: Date.now()
      })
    } catch (redisError) {
      console.error('Redis error while marking job as failed:', redisError)
    }

    return res.status(500).json({ 
      error: 'Job processing failed', 
      detail: error.message 
    })
  }
} 