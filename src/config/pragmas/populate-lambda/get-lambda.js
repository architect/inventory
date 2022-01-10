// Pragma-specific Lambda constructors
let getHTTP = require('./_http')
let getEvents = require('./_events')
let getCustomLambdas = require('./_custom-lambdas')
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
  if (type === 'queues')    return getEvents(params) // Effectively the same as events
  if (type === 'scheduled') return getScheduled(params)
  if (type === ts)          return getTablesStreams(params)
  if (type === 'tables')    return getTablesStreams(params) // Shortcut for creating streams
  /* istanbul ignore else: clearer to be explicit here */
  if (type === 'ws')        return getWS(params)
}
