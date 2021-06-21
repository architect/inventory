let { getLambdaName } = require('@architect/utils')

module.exports = function populatePlugins ({ item: pluginName, cwd, inventory, errors }) {
  if (inventory._project.plugins[pluginName]) {
    let pluginModule = inventory._project.plugins[pluginName]
    if (pluginModule.functions || pluginModule.pluginFunctions) {
      let funk = pluginModule.functions || pluginModule.pluginFunctions
      let lambdas = funk({
        arc: inventory._project.arc,
        inventory: { inv: inventory }
      }).map(fn => {
        let { name, src } = fn
        if (!src) {
          errors.push(`Invalid @plugins function, must define src directory: ${pluginName}`)
          return
        }
        // strip leading `src/` from the path to the plugin function relative to project root
        let pathToCode = src.replace(cwd, '').replace(/^\.?\/?\\?/, '').replace(/^src\/?\\?/, '')
        fn.name = name ? name : getLambdaName(pathToCode)
        return fn
      })
      if (lambdas.length) {
        return lambdas.filter(Boolean)
      }
    }
    return null
  }
  errors.push(`Invalid @plugins item: ${pluginName}`)
}
