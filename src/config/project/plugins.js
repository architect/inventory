let { join } = require('path')
let { existsSync } = require('fs')

module.exports = function getPluginModules (project, errors) {
  let arc = project.arc
  if (!arc.plugins || !arc.plugins.length) return null
  let plugins = {}
  let cwd = project.src
  for (let name of arc.plugins) {
    let pluginPath = null
    let localPath = join(cwd, 'src', 'plugins', `${name}.js`)
    let localPath1 = join(cwd, 'src', 'plugins', name)
    let modulePath = join(cwd, 'node_modules', name)
    let modulePath1 = join(cwd, 'node_modules', `@${name}`)
    if (existsSync(localPath)) pluginPath = localPath
    else if (existsSync(localPath1)) pluginPath = localPath1
    else if (existsSync(modulePath)) pluginPath = modulePath
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
  return plugins
}
