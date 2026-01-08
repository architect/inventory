// Pragma-specific Lambda constructors
let getHTTP = require('./_http')
let getEvents = require('./_events')
let getCustomLambdas = require('./_custom-lambdas')
let getQueues = require('./_queues')
let getScheduled = require('./_scheduled')
let getWS = require('./_ws')
let getTablesStreams = require('./_tables-streams')

let cl = 'customLambdas'
let ts = 'tables-streams'

module.exports = function getLambda (params) {
  let { type } = params
  if (type === 'http')      return getHTTP(params)
  if (type === 'events')    return getEvents(params)
  if (type === cl)          return getCustomLambdas(params)
  if (type === 'queues')    return getQueues(params)
  if (type === 'scheduled') return getScheduled(params)
  if (type === ts)          return getTablesStreams(params)
  if (type === 'tables')    return getTablesStreams(params) // Shortcut for creating streams
  if (type === 'ws')        return getWS(params)
}
