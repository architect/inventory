let { join } = require('path')
let is = require('../../../lib/is')

module.exports = function populateWebSockets ({ item, dir, cwd, errors, plugin }) {
  if (plugin) {
    let { name, src } = item
    if (name && src) return { ...item, route: name }
    errors.push(`Invalid plugin-generated @ws item: name: ${name}, src: ${src}`)
    return
  }
  else if (is.string(item)) {
    let name = item
    let route = name // Same as name, just what AWS calls it
    let src = join(cwd, dir, name)
    return { name, route, src }
  }
  else if (is.object(item)) {
    let name = Object.keys(item)[0]
    let route = name
    // Add back src switch on presence of item[name].src when WS gets more options
    let src = join(cwd, item[name].src)
    return { name, route, src }
  }
  errors.push(`Invalid @ws item: ${item}`)
}
