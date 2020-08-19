let { join } = require('path')

module.exports = function populateWebSockets ({ item, dir, cwd }) {
  if (typeof item === 'string') {
    let name = item
    let route = name // Same as name, just what AWS calls it
    let srcDir = join(cwd, dir, name)
    return { name, route, srcDir }
  }
  else if (typeof item === 'object' && !Array.isArray(item)) {
    let name = Object.keys(item)[0]
    let route = name
    let srcDir = item[name].path
      ? join(cwd, item[name].path)
      : join(cwd, dir, name)
    return { name, route, srcDir }
  }
  throw Error(`Invalid @ws item: ${item}`)
}
