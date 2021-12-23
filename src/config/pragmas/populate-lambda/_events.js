let { join } = require('path')
let is = require('../../../lib/is')

module.exports = function populateEvents ({ type, item, dir, cwd, errors, plugin }) {
  if (plugin) {
    let { name, src } = item
    if (name && src) return item
    errors.push(`Invalid plugin-generated @${type} item: name: ${name}, src: ${src}`)
    return
  }
  else if (is.string(item)) {
    let name = item
    let src = join(cwd, dir, name)
    return { name, src }
  }
  else if (is.object(item)) {
    let name = Object.keys(item)[0]
    let src = item[name].src
      ? join(cwd, item[name].src)
      : join(cwd, dir, name)
    return { name, src }
  }
  errors.push(`Invalid @${type} item: ${item}`)
}
