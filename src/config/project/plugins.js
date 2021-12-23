let { join } = require('path')
let { existsSync } = require('fs')
let { lambdas } = require('../../lib/pragmas')
let nonLambdaSetters = [ 'env' ]
let setters = [ ...lambdas, ...nonLambdaSetters ]
let pluginMethods = [ 'sandbox' ] // TODO add more!

module.exports = function getPluginModules (project, errors) {
  let arc = project.arc
  if (!arc.plugins || !arc.plugins.length) return null
  let plugins = {}
  let cwd = project.src
  for (let name of arc.plugins) {
    if (name === '_methods') {
      errors.push('Plugin name _methods is reserved, please rename your plugin')
      continue
    }
    let pluginPath = null
    let localPath = join(cwd, 'src', 'plugins', `${name}.js`)
    let localPath1 = join(cwd, 'src', 'plugins', name)
    let modulePath = join(cwd, 'node_modules', name)
    let modulePath1 = join(cwd, 'node_modules', `@${name}`)
    if (existsSync(localPath))        pluginPath = localPath
    else if (existsSync(localPath1))  pluginPath = localPath1
    else if (existsSync(modulePath))  pluginPath = modulePath
    else if (existsSync(modulePath1)) pluginPath = modulePath1
    if (pluginPath) {
      try {
        // eslint-disable-next-line
        plugins[name] = require(pluginPath)
      }
      catch (err) {
        errors.push(`Unable to load plugin '${name}': ${err.message.split('\n')[0]}`)
      }
    }
    else errors.push(`Cannot find plugin '${name}'! Are you sure you have installed or created it correctly?`)
  }
  // Walk each plugin and prep the method tree
  let methods = {}
  Object.entries(plugins).forEach(([ name, plugin ]) => {
    Object.entries(plugin).forEach(([ method, item ]) => {
      if (method === 'set') {
        if (!methods[method]) methods.set = {}
        setters.forEach(setter => {
          if (item[setter]) {
            if (!methods.set[setter]) methods.set[setter] = []
            let fn = item[setter]
            fn.plugin = name
            if (fn.constructor.name === 'AsyncFunction') {
              let msg = `Invalid plugin, setters must be synchronous functions: plugin: ${name}, method: set.${setter}`
              errors.push(msg)
            }
            else methods.set[setter].push(fn)
          }
        })
      }
      else if (pluginMethods.includes(method)) {
        if (!methods[method]) methods[method] = []
        let fn = item
        fn.plugin = name
        methods[method].push(fn)
      }
    })
  })
  plugins._methods = methods
  return plugins
}
