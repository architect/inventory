let read = require('../../../read')
let getLambda = require('./get-lambda')
let getRuntime = require('./get-runtime')
let getHandler = require('./get-handler')
let upsert = require('../../_upsert')
let defaultFunctionConfig = require('../../../defaults/function-config')
let { compiledRuntimes, is } = require('../../../lib')

/**
 * Build out the Lambda tree from the Arc manifest or a passed pragma, and plugins
 */
function populateLambda (type, { arc, inventory, errors, pragma }) {
  let plugins = inventory.plugins?._methods?.set?.[type]
  let pluginLambda = []
  if (plugins) {
    let pluginResults = plugins.flatMap(fn => {
      let result = fn({ arc, inventory })
      if (!result) {
        errors.push(`Setter plugins must return a valid response: plugin: ${fn.plugin}, method: set.${type}`)
        return []
      }
      result.plugin = fn.plugin
      result.type = fn.type
      return result
    })
    pluginLambda = populate(type, pluginResults, inventory, errors, true) || []
  }
  let pragmaLambda = populate(type, pragma || arc[type], inventory, errors) || []
  let aggregate = [ ...pluginLambda, ...pragmaLambda ]
  return aggregate.length ? aggregate : null
}

function populate (type, pragma, inventory, errors, plugin) {
  if (!pragma || !pragma.length) return

  let defaultProjectConfig = () => JSON.parse(JSON.stringify(inventory._project.defaultFunctionConfig))
  let { cwd, src: projSrc, build: projBuild } = inventory._project

  // Fill er up
  let lambdas = []

  for (let item of pragma) {
    // Get name, source dir, and any pragma-specific properties
    let result = getLambda({ type, item, cwd, projSrc, projBuild, inventory, errors, plugin })
    // Some Lambda populators (e.g. plugins) may return empty result
    if (!result) continue

    let { name, src, build } = result
    // Set up fresh config, then overlay plugin config
    let config = defaultProjectConfig()
    config = { ...config, ...getKnownProps(configProps, result.config) }

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

    // Interpolate runtimes
    config = getRuntime({ config, inventory })

    // Disable code sharing on [trans|com]piled functions
    if (compiledRuntimes.includes(config.runtimeConfig?.type)) {
      config.shared = config.views = false
    }

    // Tidy up any irrelevant properties
    if (!compiledRuntimes.includes(config.runtimeConfig?.type)) {
      // Important: if we don't clean up the build prop, many explosions will explode
      build = undefined
    }
    if (type !== 'http') {
      delete config.apigateway
    }

    // Now we know the final source dir + runtime + handler: assemble handler props
    let handlerProps = getHandler({ config, src, build, errors })

    let lambda = {
      name,
      ...getKnownProps(lambdaProps, result), // Pragma-specific stuff
      config,
      src,
      build,
      ...handlerProps,
      configFile,
      pragma: type !== 'customLambdas' ? type : null,
    }
    // Final tidying of any undefined properties
    Object.keys(lambda).forEach(k => !is.defined(lambda[k]) && delete lambda[k])

    lambdas.push(lambda)
  }

  return lambdas
}

// Lambda setter plugins can technically return anything, so this ensures everything is tidy
let lambdaProps = [ 'cron', 'method', 'path', 'plugin', 'rate', 'route', 'table' ]
let configProps = [ ...Object.keys(defaultFunctionConfig()), 'fifo', 'views' ]
let getKnownProps = (knownProps, raw = {}) => {
  let props = knownProps.flatMap(prop => is.defined(raw[prop]) ? [ [ prop, raw[prop] ] ] : [])
  return Object.fromEntries(props)
}

let cl = 'customLambdas'
let ts = 'tables-streams'

module.exports = {
  events:     populateLambda.bind({}, 'events'),
  http:       populateLambda.bind({}, 'http'),
  [cl]:       populateLambda.bind({}, cl),
  queues:     populateLambda.bind({}, 'queues'),
  scheduled:  populateLambda.bind({}, 'scheduled'),
  tables:     populateLambda.bind({}, 'tables'),
  [ts]:       populateLambda.bind({}, ts),
  ws:         populateLambda.bind({}, 'ws'),
}
