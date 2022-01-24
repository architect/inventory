let { is } = require('../../../lib')

module.exports = function setEnvPlugins (params, project) {
  let { errors, inventory } = params
  let envPlugins = inventory.plugins?._methods?.set?.env
  if (envPlugins?.length) {
    let env = {}

    // inventory._project is not yet built, so provide as much as we can to plugins for now
    let inv = { ...inventory, _project: project }
    envPlugins.forEach(fn => {
      let errType = `plugin: ${fn.plugin}, method: set.env`
      try {
        let result = fn({ inventory: { inv } })
        if (!is.object(result) || !Object.keys(result).length) {
          return errors.push(`Env plugin returned invalid data, must return an Object with one or more keys + values: ${errType}`)
        }
        Object.entries(result).forEach(([ k, v ]) => {
          if (env[k]) {
            return errors.push(`Env var '${k}' already registered: ${errType}`)
          }
          if (is.object(v) || is.array(v)) env[k] = JSON.stringify(v)
          else env[k] = String(v)
        })
      }
      catch (err) {
        errors.push(`Runtime plugin '${fn.plugin}' failed: ${err.message}`)
      }
    })
    return { testing: env, staging: env, production: env }
  }
  return inventory._project.env.plugins
}
