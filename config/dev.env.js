var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  DOCKER: process.env.DOCKER,
  LIVE_QUERY_URL: '"' + process.env.LIVE_QUERY_URL + '"'
})
