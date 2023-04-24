let { aliases, runtimeList } = require('lambda-runtimes')
let { deepFrozenCopy } = require('@architect/utils')
let { is, validationPatterns } = require('../../../lib')
let { looserName } = validationPatterns
let allRuntimes = runtimeList.concat([ 'deno', ...Object.keys(aliases) ])
let validTypes = [ 'transpiled', 'compiled', 'interpreted' ]
let builtTypes = validTypes.filter(t => t !== 'interpreted')

module.exports = function setRuntimePlugins (params, project) {
  let { errors, inventory } = params
  let runtimePlugins = inventory.plugins?._methods?.set?.runtimes
  if (runtimePlugins?.length) {
    let runtimes = {
      runtimes: [],
      runtimePlugins: {}, // Map runtimes to their corresponding plugins
    }
    // inventory._project is not yet built, so provide as much as we can to plugins for now
    let inv = deepFrozenCopy({ ...inventory, _project: project })
    let build
    runtimePlugins.forEach(fn => {
      let errType = `plugin: ${fn._plugin}, method: set.runtimes`
      try {
        var result = fn({ arc: inv._project.arc, inventory: { inv } })
      }
      catch (err) {
        err.message = `Runtime plugin exception: ${errType}\n` + err.message
        throw err
      }
      // Accept one or more results, then loop through them
      result = is.array(result) ? result : [ result ]
      result.forEach(runtime => {
        let { name, type, baseRuntime } = runtime
        if (!name || !looserName.test(name)) {
          let msg = `Runtime plugin must provide a valid name: ${errType}`
          return errors.push(msg)
        }
        if (!type || !validTypes.includes(type)) {
          let msg = `Runtime plugin must provide a valid type: ${errType}`
          return errors.push(msg)
        }
        if (allRuntimes.includes(name)) {
          let msg = `Runtime name '${name}' is reserved: ${errType}`
          return errors.push(msg)
        }
        if (runtimes[name]) {
          let msg = `Runtime name '${name}' already registered: ${errType}`
          return errors.push(msg)
        }
        if (builtTypes.includes(type)) {
          if (build && runtime.build && build !== runtime.build) {
            return errors.push(`Runtime '${name}' cannot set a build directory, as it is already configured to: ${build}`)
          }
          // Adhere to Postel's Law
          build = 'build'
          if (is.string(runtime.build)) build = runtime.build
          if (type === 'compiled') {
            runtime.baseRuntime = runtime.baseRuntime || 'provided.al2'
          }
        }
        if (type === 'transpiled' && !allRuntimes.includes(baseRuntime)) {
          return errors.push(`Runtime '${name}' must include a valid baseRuntime property corresponding to a valid Lambda runtime (e.g. 'nodejs18.x')`)
        }
        runtimes.runtimes.push(name)
        runtimes.runtimePlugins[name] = fn._plugin
        runtimes[name] = runtime
      })
    })
    return { build, runtimes, runtimePlugins }
  }
  return {}
}
