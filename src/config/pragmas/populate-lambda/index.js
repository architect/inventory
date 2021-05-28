let read = require('../../../read')
let getHandler = require('./get-handler')
let upsert = require('../../_upsert')

// Pragma-specific Lambda constructors
let getHTTP = require('./_http')
let getEvents = require('./_events')
let getPlugins = require('./_plugins')
let getScheduled = require('./_scheduled')
let getWS = require('./_websockets')
let getStreams = require('./_streams')

/**
 * Build out the Lambda tree
 */
function populateLambda (type, pragma, inventory, errors) {
  if (!pragma || !pragma.length) return null // Jic

  let createDefaultConfig = () => JSON.parse(JSON.stringify(inventory._project.defaultFunctionConfig))
  let cwd = inventory._project.src

  // Fill er up
  let lambdas = []

  for (let item of pragma) {
    // Get name, source dir, and any pragma-specific properties
    let results = getLambda({ type, item, cwd, inventory, errors })
    // Some lambda populators (e.g. plugins) may return empty results
    if (!results) continue
    // Some lambda populators (e.g. plugins) may return multiple results
    if (!(Array.isArray(results))) results = [ results ]

    results.forEach(result => {
      let { name, src } = result
      // Set up fresh config
      let config = createDefaultConfig()

      // Knock out any pragma-specific early
      if (type === 'queues') {
        config.fifo = config.fifo === undefined ? true : config.fifo
      }
      if (type === 'http') {
        if (name.startsWith('get ') || name.startsWith('any ')) config.views = true
      }

      // Now let's check in on the function config
      let { arc: arcConfig, filepath } = read({ type: 'functionConfig', cwd: src, errors })

      // Set function config file path (if one is present)
      let configFile = filepath ? filepath : null

      // Layer any function config over Arc / project defaults
      if (arcConfig && arcConfig.aws) {
        config = upsert(config, arcConfig.aws)
      }
      if (arcConfig && arcConfig.arc) {
        config = upsert(config, arcConfig.arc)
      }

      // Tidy up any irrelevant params
      if (type !== 'http') {
        delete config.apigateway
      }

      // Now we know the final source dir + runtime + handler: assemble handler props
      let { handlerFile, handlerFunction } = getHandler(config, src, errors)

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
    })
  }

  return lambdas
}

function getLambda (params) {
  let { type } = params
  params.dir = `src/${type}/`

  if (type === 'http')      return getHTTP(params)
  if (type === 'events')    return getEvents(params)
  if (type === 'plugins')   return getPlugins(params)
  if (type === 'queues')    return getEvents(params) // Effectively the same as events
  if (type === 'scheduled') return getScheduled(params)
  if (type === 'streams')   return getStreams(params)
  if (type === 'tables')    return getStreams(params) // Shortcut for creating streams
  /* istanbul ignore else */ /* Clearer to be explicit here */
  if (type === 'ws')        return getWS(params)
}

module.exports = {
  events:     populateLambda.bind({}, 'events'),
  http:       populateLambda.bind({}, 'http'),
  plugins:    populateLambda.bind({}, 'plugins'),
  queues:     populateLambda.bind({}, 'queues'),
  scheduled:  populateLambda.bind({}, 'scheduled'),
  streams:    populateLambda.bind({}, 'streams'),
  tables:     populateLambda.bind({}, 'tables'),
  ws:         populateLambda.bind({}, 'ws'),
}
