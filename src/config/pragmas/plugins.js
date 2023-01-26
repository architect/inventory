let { join, sep } = require('path')
let { existsSync } = require('fs')
let { is, pragmas, tidyError, validationPatterns } = require('../../lib')
let { lambdas } = pragmas
let nonLambdaSetters = [ 'customLambdas', 'env', 'proxy', 'runtimes', 'shared', 'static', 'views', 'tables', 'tables-indexes' ]
let setters = [ ...lambdas, ...nonLambdaSetters ]
let pluginMethods = [ 'deploy', 'hydrate', 'sandbox' ]
let reservedNames = [ '_methods' ]

module.exports = async function getPluginModules ({ arc, inventory, errors }) {
  if (!arc?.plugins?.length && !arc?.macros?.length) return null
  let plugins = {}
  let methods = {}
  let { cwd } = inventory._project

  let pluginItems = []
  let tagPlugins = (arr, type) => pluginItems.push(...arr.map(p => ({ plugin: p, type })))
  if (arc?.plugins?.length) tagPlugins(arc.plugins, 'plugin')
  if (arc?.macros?.length) tagPlugins(arc.macros, 'macro')

  for (let pluginItem of pluginItems) {
    let { plugin, type } = pluginItem
    let name
    let pluginPath

    if (is.string(plugin)) {
      name = plugin
      pluginPath = getPath(cwd, type + 's', name)
    }
    else if (is.object(plugin)) {
      name = Object.keys(plugin)[0]
      pluginPath = plugin[name].src
        ? resolve('.' + sep + plugin[name].src, cwd)
        : join(cwd, 'src', type + 's', name)
    }

    if (reservedNames.includes(name)) {
      errors.push(`Plugin name ${name} is reserved, please rename your plugin`)
      continue
    }
    if (!validationPatterns.veryLooseName.test(name)) {
      errors.push('Plugin names can only contain [a-zA-Z0-9/\\-._]')
      continue
    }

    if (pluginPath) {
      try {
        /* istanbul ignore next: idk why but for some reason nyc isn't picking up the catches; all cases are covered in tests, though! */
        if (type === 'plugin') {
          try {
            // eslint-disable-next-line
            plugins[name] = require(pluginPath)
          }
          catch (err) {
            if (hasEsmError(err)) {
              let path =  process.platform.startsWith('win')
                ? 'file://' + pluginPath
                : pluginPath
              let plugin = await import(path)
              plugins[name] = plugin.default ? plugin.default : plugin
            }
            else {
              throw err
            }
          }
        }
        // Remap @macros to deploy.start
        if (type === 'macro') {
          // eslint-disable-next-line
          plugins[name] = { deploy: { start: require(pluginPath) } }
        }
        // Walk each plugin and build the method tree
        Object.entries(plugins[name]).forEach(([ method, item ]) => {
          // Primitive setters
          if (method === 'set') {
            if (!methods.set) methods.set = {}
            setters.forEach(setter => {
              if (item[setter]) {
                let fn = item[setter]
                if (!is.fn(fn) || fn.constructor.name === 'AsyncFunction') {
                  let msg = `Invalid plugin, setters must be synchronous functions: plugin: ${name}, method: set.${setter}`
                  errors.push(msg)
                  return
                }
                if (!methods.set[setter]) methods.set[setter] = []
                fn._plugin = name
                fn._type = type
                methods.set[setter].push(fn)
              }
            })
          }
          // Command hooks
          else if (pluginMethods.includes(method)) {
            Object.entries(item).forEach(([ hook, fn ]) => {
              if (!is.fn(fn)) {
                let msg = `Invalid plugin, must be a function: plugin: ${name}, method: ${method}.${hook}`
                errors.push(msg)
                return
              }
              if (!methods[method]) methods[method] = {}
              if (!methods[method][hook]) methods[method][hook] = []
              fn._plugin = name
              fn._type = type
              methods[method][hook].push(fn)
            })
          }
        })
      }
      catch (err) {
        errors.push(`Unable to load plugin '${name}': ${tidyError(err)}`)
      }
    }
    else errors.push(`Cannot find plugin '${name || plugin}'! Are you sure you have installed or created it correctly?`)
  }
  plugins._methods = methods
  return plugins
}

function getPath (cwd, srcDir, name) {
  let path1 = join(cwd, 'src', srcDir, `${name}.js`)
  let path2 = join(cwd, 'src', srcDir, `${name}.mjs`)
  let path3 = join(cwd, 'src', srcDir, name)
  /**/ if (existsSync(path1)) return path1
  else if (existsSync(path2)) return path2
  else if (existsSync(path3)) return resolve(path3, cwd)
  return resolve(name, cwd)
}

function resolve (path, cwd) {
  try {
    return require.resolve(path, { paths: [ cwd ] })
  }
  catch {
    try {
      return require.resolve(`@${path}`, { paths: [ cwd ] })
    }
    catch {
      return
    }
  }
}

let esmErrors = [
  'Cannot use import statement outside a module',
  `Unexpected token 'export'`,
  'require() of ES Module',
  'Must use import to load ES Module',
]
let hasEsmError = err => esmErrors.some(msg => err.message.includes(msg))
