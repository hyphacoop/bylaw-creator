// On Vercel, jobs run synchronously and the result is returned inline, because the
// in-memory job store is not shared between function instances (so there is no
// status endpoint here; the client only polls when submit returns 202).
const auth = require('../../server/lib/auth')
const jobs = require('../../server/lib/jobs')
const { send, methodNotAllowed, unauthorized } = require('../../server/lib/http')

module.exports = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
  if (!auth.isAuthenticated(req)) return send(res, unauthorized)
  try {
    send(res, await jobs.submit(req.body, { sync: true }))
  } catch (error) {
    console.error('Job submission error:', error)
    res.status(500).json({ error: 'Failed to submit job', detail: error.message })
  }
}
