/*
let { getLambdaName } = require('@architect/utils')

module.exports = function populatePlugins ({ item: pluginName, cwd, inventory, errors }) {
  if (inventory._project.plugins[pluginName]) {
    let pluginModule = inventory._project.plugins[pluginName]
    if (pluginModule.functions || pluginModule.pluginFunctions) {
      let funk = pluginModule.functions || pluginModule.pluginFunctions
      let lambdas = funk({
        arc: inventory._project.arc,
        inventory: { inv: inventory }
      }).map(f => {
        // strip leading `src/` from the path to the plugin function relative to project root
        let pathToCode = f.src.replace(cwd, '').replace(/^\.?\/?\\?/, '').replace(/^src\/?\\?/, '')
        let name = getLambdaName(pathToCode)
        f.name = name
        return f
      })
      if (lambdas.length) {
        return lambdas
      }
    }
    return null
  }
  errors.push(`Invalid @plugins item: ${pluginName}`)
}
 */
