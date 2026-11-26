const auth = require('../../server/lib/auth')
const { methodNotAllowed } = require('../../server/lib/http')

module.exports = (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])
  res.status(200).json({ authenticated: auth.isAuthenticated(req) })
}
