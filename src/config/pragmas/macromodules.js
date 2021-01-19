const { join } = require('path')
const { existsSync } = require('fs')

module.exports = function configureMacroModules ({ arc, inventory }) {
  if (!arc.macros || !arc.macros.length) return {}
  let macroMap = {}
  let cwd = inventory._project.src
  for (let name of arc.macros) {
    let macroPath = null
    let localPath = join(cwd, 'src', 'macros', `${name}.js`)
    let localPath1 = join(cwd, 'src', 'macros', name)
    let modulePath = join(cwd, 'node_modules', name)
    let modulePath1 = join(cwd, 'node_modules', `@${name}`)
    if (existsSync(localPath)) macroPath = localPath
    else if (existsSync(localPath1)) macroPath = localPath1
    else if (existsSync(modulePath)) macroPath = modulePath
    else if (existsSync(modulePath1)) macroPath = modulePath1
    // eslint-disable-next-line
    if (macroPath) macroMap[name] = require(macroPath)
    else console.warn(`Cannot find macro ${name}! Are you sure you have installed or created it correctly?`)
  }
  return macroMap
}
