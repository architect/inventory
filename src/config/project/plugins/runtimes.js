let { is } = require('../../../lib')
let { aliases, runtimeList } = require('lambda-runtimes')
let allRuntimes = runtimeList.concat([ 'deno', ...Object.keys(aliases) ])

module.exports = function setRuntimePlugins (params, project) {
  let { errors, inventory } = params
  let runtimePlugins = inventory.plugins?._methods?.set?.runtimes
  if (runtimePlugins?.length) {
    let runtimes = {
      runtimes: [],
    }
    // inventory._project is not yet built, so provide as much as we can to plugins for now
    let inv = { ...inventory, _project: project }
    let build
    runtimePlugins.forEach(fn => {
      let errType = `plugin: ${fn.plugin}, method: set.runtimes`
      try {
        let result = fn({ inventory: inv })
        result = is.array(result) ? result : [ result ]
        result.forEach(runtime => {
          // TODO add more validation
          let { name } = runtime
          if (!name) {
            let msg = `Runtime plugin must provide a name: ${errType}`
            return errors.push(msg)
          }
          if (allRuntimes.includes(name)) {
            let msg = `Runtime name '${name}' is reserved: ${errType}`
            return errors.push(msg)
          }
          if (runtimes[name]) {
            let msg = `Runtime '${name}' already registered: ${errType}`
            return errors.push(msg)
          }
          if (runtime.build) {
            if (is.bool(runtime.build) ||
                !is.string(runtime.build)) {
              build = 'build'
            }
            else build = runtime.build
          }
          runtimes.runtimes.push(name)
          runtimes[name] = runtime
        })
      }
      catch (err) {
        errors.push(`Runtime plugin '${fn.plugin}' failed: ${err.message}`)
      }
    })
    if (build && runtimePlugins.length > 1) {
      let msg = `Runtime plugins that compile to a build directory cannot be used with other runtime plugins, got: '${runtimes.runtimes.join(`', '`)}'`
      errors.push(msg)
      return
    }
    return { build, runtimes }
  }
  return null
}
