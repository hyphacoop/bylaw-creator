import { parse } from 'cookie'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
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

  if (req.method !== 'GET') {
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

  const { jobId } = req.query

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' })
  }

  try {
    const jobData = await redis.hgetall(`job:${jobId}`)

    if (!jobData || Object.keys(jobData).length === 0) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const response = {
      jobId,
      status: jobData.status,
      createdAt: parseInt(jobData.createdAt)
    }

    // Add timestamps based on status
    if (jobData.updatedAt) {
      response.updatedAt = parseInt(jobData.updatedAt)
    }
    if (jobData.completedAt) {
      response.completedAt = parseInt(jobData.completedAt)
    }
    if (jobData.failedAt) {
      response.failedAt = parseInt(jobData.failedAt)
      response.error = jobData.error
    }

    // Only include result if completed (reduces payload size for polling)
    if (jobData.status === 'completed' && jobData.result) {
      response.result = jobData.result
    }

    // Add estimated completion time for better UX
    if (jobData.status === 'processing' && jobData.updatedAt) {
      const processingTime = Date.now() - parseInt(jobData.updatedAt)
      response.processingTimeMs = processingTime
      
      // Suggest longer polling intervals for long-running jobs
      if (processingTime > 30000) { // 30 seconds
        response.suggestedPollInterval = Math.min(15000, processingTime / 4) // Max 15s
      }
    }

    return res.status(200).json(response)

  } catch (error) {
    console.error('Status check error:', error)
    return res.status(500).json({ 
      error: 'Failed to check job status', 
      detail: error.message 
    })
  }
} 