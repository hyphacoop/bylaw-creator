// Bylaw generation jobs: validation, execution and status formatting.
const crypto = require('crypto')
const store = require('./jobStore')
const ollama = require('./ollama')

function extractRequest(body) {
  const payload = body && body.payload
  const prompt = payload && Array.isArray(payload.messages) && payload.messages[0] && payload.messages[0].content
  if (!payload || !payload.model || !prompt) {
    return { error: 'Invalid job payload: expected payload.model and payload.messages[0].content' }
  }
  // Output length is controlled by the server (OLLAMA_NUM_PREDICT), not the client
  return { model: payload.model, prompt }
}

async function runJob(jobId, request) {
  store.update(jobId, { status: 'processing', updatedAt: Date.now() })
  try {
    console.log(`🦙 Job ${jobId}: generating with ${request.model}`)
    const { text, truncated, tokens } = await ollama.generate(request)
    store.update(jobId, { status: 'completed', result: text, truncated, completedAt: Date.now() })
    if (truncated) {
      console.warn(`⚠️  Job ${jobId}: output hit the token limit (${tokens} tokens) and was cut off`)
    } else {
      console.log(`✅ Job ${jobId}: completed (${tokens} tokens, ${text.length} chars)`)
    }
  } catch (error) {
    console.error(`❌ Job ${jobId}: ${error.message}`)
    store.update(jobId, { status: 'failed', error: error.message, failedAt: Date.now() })
  }
}

// Submit a job. Returns immediately (202) with a jobId; the client polls for status.
function submit(body) {
  const request = extractRequest(body)
  if (request.error) return { status: 400, body: { error: request.error } }

  const jobId = crypto.randomUUID()
  store.create(jobId)

  runJob(jobId, request).catch((err) => console.error('Unexpected job error:', err))
  return {
    status: 202,
    body: { jobId, status: 'queued', message: 'Job submitted successfully. Use the status endpoint to check progress.' },
  }
}

function formatStatus(job) {
  const response = { jobId: job.jobId, status: job.status, createdAt: job.createdAt }
  if (job.updatedAt) response.updatedAt = job.updatedAt
  if (job.completedAt) response.completedAt = job.completedAt
  if (job.failedAt) {
    response.failedAt = job.failedAt
    response.error = job.error
  }
  if (job.status === 'completed') {
    response.result = job.result
    response.truncated = !!job.truncated
  }
  if (job.status === 'processing' && job.updatedAt) {
    const processingTime = Date.now() - job.updatedAt
    response.processingTimeMs = processingTime
    if (processingTime > 30000) response.suggestedPollInterval = Math.min(15000, processingTime / 4)
  }
  return response
}

function status(jobId) {
  if (!jobId) return { status: 400, body: { error: 'Job ID is required' } }
  const job = store.get(String(jobId))
  if (!job) return { status: 404, body: { error: 'Job not found' } }
  return { status: 200, body: formatStatus(job) }
}

module.exports = { submit, status }
