const health = require('../server/lib/health')
const { send } = require('../server/lib/http')

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  send(res, health.liveness())
}
