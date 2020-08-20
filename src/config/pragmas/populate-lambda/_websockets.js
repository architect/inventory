let { join } = require('path')

module.exports = function populateWebSockets ({ item, dir, cwd }) {
  if (typeof item === 'string') {
    let name = item
    let route = name // Same as name, just what AWS calls it
    let src = join(cwd, dir, name)
    return { name, route, src }
  }
  else if (typeof item === 'object' && !Array.isArray(item)) {
    let name = Object.keys(item)[0]
    let route = name
    let src = item[name].src
      ? join(cwd, item[name].src)
      : join(cwd, dir, name)
    return { name, route, src }
  }
  throw Error(`Invalid @ws item: ${item}`)
}
