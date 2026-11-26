// Small helpers to send { status, body, cookie? } results from the shared lib
// using either Express or Vercel's Node response object.
function send(res, result) {
  if (result.cookie) res.setHeader('Set-Cookie', result.cookie)
  res.status(result.status).json(result.body)
}

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '))
  res.status(405).json({ error: 'Method not allowed' })
}

const unauthorized = { status: 401, body: { error: 'Authentication required' } }

module.exports = { send, methodNotAllowed, unauthorized }
