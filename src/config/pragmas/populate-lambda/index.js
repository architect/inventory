let readArcConfig = require('../../../read/arc-config')
let getHandler = require('./get-handler')
let upsert = require('../../_upsert')

// Pragma-specific Lambda constructors
let getHTTP = require('./_http')
let getEvents = require('./_events')
let getScheduled = require('./_scheduled')
let getWS = require('./_websockets')
let getStreams = require('./_streams')

/**
 * Build out the Lambda tree
 */
function populateLambda (type, pragma, inventory) {
  if (!pragma || !pragma.length) return null // Jic

  let createDefaultConfig = () => JSON.parse(JSON.stringify(inventory.project.defaultFunctionConfig))
  let cwd = inventory.project.src

  // Fill er up
  let lambdas = []

  for (let item of pragma) {
    // Set up fresh config
    let config = createDefaultConfig()

    // Get name, source dir, and any pragma-specific properties
    let result = getLambda({ type, item, cwd })
    let { name, src } = result

    // Knock out any pragma-specific early
    if (type === 'queues') config.fifo = true
    if (type === 'http') {
      if (name.startsWith('get ') || name.startsWith('any ')) config.views = true
    }

    // Populate the handler before deferring to function config
    if (item[name] && item[name].handler) config.handler = item[name].handler

    // Now let's check in on the function config
    let { arc: arcConfig, filepath, errors } = readArcConfig({ cwd: src })
    if (errors) throw Error(errors)

    // Set function config file path (if one is present)
    let configFile = filepath ? filepath : null

    // Layer any function config over Arc / project defaults
    if (arcConfig && arcConfig.aws) {
      config = upsert(config, arcConfig.aws)
    }
    if (arcConfig && arcConfig.arc) {
      config = upsert(config, arcConfig.arc)
    }

    // Now we know the final source dir + runtime + handler: assemble handler props
    let { handlerFile, handlerFunction } = getHandler(config, src)

    let lambda = {
      name,
      config,
      src,
      handlerFile,
      handlerFunction,
      configFile,
      ...result, // Any other pragma-specific stuff
    }

    lambdas.push(lambda)
  }

  return lambdas
}

function getLambda (params) {
  let { type } = params
  params.dir = `src/${type}/`

  if (type === 'http')      return getHTTP(params)
  if (type === 'events')    return getEvents(params)
  if (type === 'queues')    return getEvents(params) // Effectively the same as events
  if (type === 'scheduled') return getScheduled(params)
  if (type === 'streams')   return getStreams(params)
  if (type === 'tables')    return getStreams(params) // Shortcut for creating streams
  if (type === 'ws')        return getWS(params)
}

module.exports = {
  events: populateLambda.bind({}, 'events',),
  http: populateLambda.bind({}, 'http',),
  queues: populateLambda.bind({}, 'queues',),
  scheduled: populateLambda.bind({}, 'scheduled',),
  streams: populateLambda.bind({}, 'streams',),
  tables: populateLambda.bind({}, 'tables',),
  ws: populateLambda.bind({}, 'ws',),
}
