// In-memory job store with a TTL. Jobs are lost on restart, which is fine for
// a single-instance deployment (local dev or one Docker container).
const TTL_MS = 24 * 60 * 60 * 1000
const jobs = new Map()

function create(jobId) {
  jobs.set(jobId, { jobId, status: 'queued', createdAt: Date.now() })
}

function update(jobId, fields) {
  const job = jobs.get(jobId)
  if (job) Object.assign(job, fields)
}

function get(jobId) {
  const job = jobs.get(jobId)
  if (!job) return null
  if (Date.now() - job.createdAt > TTL_MS) {
    jobs.delete(jobId)
    return null
  }
  return job
}

function sweep() {
  const now = Date.now()
  for (const [id, job] of jobs) {
    if (now - job.createdAt > TTL_MS) jobs.delete(id)
  }
}

// Counts of live jobs by status, for monitoring
function stats() {
  sweep()
  const counts = { queued: 0, processing: 0, completed: 0, failed: 0 }
  for (const job of jobs.values()) counts[job.status] = (counts[job.status] || 0) + 1
  return counts
}

setInterval(sweep, 60 * 60 * 1000).unref()

module.exports = { create, update, get, stats }
