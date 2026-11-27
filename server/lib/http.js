// server/lib functions return plain { status, body, cookie? } results instead of
// touching the response, which keeps them free of Express and easy to test.
// send() writes such a result to an Express response.
function send(res, result) {
  if (result.cookie) res.setHeader('Set-Cookie', result.cookie)
  res.status(result.status).json(result.body)
}

const unauthorized = { status: 401, body: { error: 'Authentication required' } }

module.exports = { send, unauthorized }
