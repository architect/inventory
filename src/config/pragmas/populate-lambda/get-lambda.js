// Pragma-specific Lambda constructors
let getHTTP = require('./_http')
let getEvents = require('./_events')
let getPlugins = require('./_plugins')
let getScheduled = require('./_scheduled')
let getWS = require('./_websockets')
let getTablesStreams = require('./_tables-streams')

let ts = 'tables-streams'

module.exports = function getLambda (params) {
  let { type } = params
  params.dir = `src/${type}/`

  if (type === 'http')      return getHTTP(params)
  if (type === 'events')    return getEvents(params)
  if (type === 'plugins')   return getPlugins(params)
  if (type === 'queues')    return getEvents(params) // Effectively the same as events
  if (type === 'scheduled') return getScheduled(params)
  if (type === ts)          return getTablesStreams(params)
  if (type === 'tables')    return getTablesStreams(params) // Shortcut for creating streams
  /* istanbul ignore else: clearer to be explicit here */
  if (type === 'ws')        return getWS(params)
}
