const auth = require('../../server/lib/auth')
const { send, methodNotAllowed } = require('../../server/lib/http')

module.exports = (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
  send(res, auth.login(req.body && req.body.password))
}
