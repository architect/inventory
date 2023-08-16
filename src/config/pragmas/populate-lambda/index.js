let { basename, sep } = require('path')
let { deepFrozenCopy } = require('@architect/utils')
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
function populateLambda (type, params) {
  // Passing a pragma array via params allows special overrides
  // See: @tables populating inv['tables-streams']
  let { arc, inventory, errors, pragma } = params

  let plugins = inventory.plugins?._methods?.set?.[type]
  let pluginLambda = []
  if (plugins) {
    let invCopy = deepFrozenCopy(inventory)
    let pluginResults = plugins.flatMap(fn => {
      try {
        var result = fn({ arc: invCopy._project.arc, inventory: { inv: invCopy } })
      }
      catch (err) {
        err.message = `Setter plugin exception: plugin: ${fn._plugin}, method: set.${type}`
                      + `\n` + err.message
        throw err
      }
      if (!result ||
          (!is.object(result) && !is.array(result)) ||
          (is.array(result) && result.some(r => !is.object(r)))) {
        errors.push(`Setter plugins must return a valid response: plugin: ${fn._plugin}, method: set.${type}`)
        return []
      }
      if (is.array(result)) {
        result.forEach((item, i) => {
          item._plugin = fn._plugin
          item._type = fn._type
          result[i] = item
        })
      }
      else {
        result._plugin = fn._plugin
        result._type = fn._type
      }
      return result
    })
    pluginLambda = populate(type, pluginResults, inventory, errors, true) || []
  }

  let pragmaLambda = populate(type, pragma || arc[type], inventory, errors) || []
  let aggregate = [ ...pluginLambda, ...pragmaLambda ]

  // Filter plugins, if appropriate: not required, but do conflict with a manifest entry
  aggregate = aggregate.filter(lambda => {
    if (lambda._plugin && !lambda.required &&
        aggregate.some(({ name, _plugin }) => !_plugin && name === lambda.name)) {
      return false
    }
    return true
  })
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

    // Normalize paths, especially since plugin authors may not use path.join
    src = normalize(src)
    if (build) build = normalize(build)

    // Set up fresh config, then overlay plugin config
    let config = defaultProjectConfig()
    config = { ...config, ...getKnownProps(configProps, result.config) }

    // Knock out any pragma-specific early
    if (type === 'queues') {
      config.fifo = config.fifo === undefined ? true : config.fifo
    }
    if (type === 'http') {
      if (name.startsWith('get ') || name.startsWith('any ')) {
        config.views = config.views === undefined ? true : config.views
      }
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
      // Super important! If we don't clean up the build prop, many explosions will explode
      build = undefined
    }
    if (type !== 'http') {
      delete config.apigateway
    }

    // Now we know the final source dir + runtime + handler: assemble handler props
    let handlerProps = getHandler({ config, build, errors, src })

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
    // Ensure the correct handler configuration is being used
    // If the config is the same as the default, regenerate the setting based on the returned handlerFile, as Python / Ruby may have it set to `lambda.`
    if (config.handler === defaultProjectConfig().handler) {
      let { handlerFile } = handlerProps
      let file = basename(handlerFile).split('.')[0]
      config.handler = `${file}.handler`
    }

    // Final tidying of any undefined properties
    Object.keys(lambda).forEach(k => !is.defined(lambda[k]) && delete lambda[k])

    // Pass through the plugin tag and required status
    if (item._plugin) {
      lambda._plugin = item._plugin
      if (item.required === true) lambda.required = true
    }

    lambdas.push(lambda)
  }

  return lambdas
}

let normalize = path => path.replace(/[\\\/]/g, sep)

// Lambda setter plugins can technically return anything, so this ensures everything is tidy
let lambdaProps = [ 'cron', 'method', 'path', 'plugin', 'rate', 'route', 'table', 'type' ]
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
