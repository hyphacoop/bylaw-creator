import { parse } from 'cookie'
import { Redis } from '@upstash/redis'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

// Job processing is now handled by the webhook endpoint at /api/jobs/process

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

async function triggerJobProcessing(jobId) {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.FRONTEND_URL || 'http://localhost:3000'
    
    console.log('Triggering job processing via webhook for:', jobId)
    
    // Trigger the processing webhook (don't wait for response)
    fetch(`${baseUrl}/api/jobs/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'true' // Mark as internal request
      },
      body: JSON.stringify({ jobId })
    }).catch(error => {
      console.error('Failed to trigger webhook:', error)
    })
    
    return true
  } catch (error) {
    console.error('Webhook trigger error:', error)
    return false
  }
}

export default async function handler(req, res) {
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

  // Get API key (just validate it exists, don't process here)
  const apiKey = getClaudeApiKey(auth.password)
  if (!apiKey && !req.body.isOllamaModel) {
    return res.status(500).json({ error: 'API key not available' })
  }

  try {
    // Generate unique job ID
    const jobId = uuidv4()
    
    console.log('Submitting job:', jobId)
    
    // Store job data including auth info for webhook processing
    await redis.hset(`job:${jobId}`, {
      status: 'queued',
      jobData: JSON.stringify(req.body),
      userPassword: auth.password, // Store for API key decryption in webhook
      createdAt: Date.now()
    })

    // Trigger webhook processing (fire and forget)
    triggerJobProcessing(jobId)

    // Return immediately
    return res.status(202).json({ 
      jobId,
      status: 'queued',
      message: 'Job submitted successfully. Processing will begin in background.'
    })

  } catch (error) {
    console.error('Job submission error:', error)
    return res.status(500).json({ 
      error: 'Failed to submit job', 
      detail: error.message 
    })
  }
} 