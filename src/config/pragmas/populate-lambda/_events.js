let { join } = require('path')

module.exports = function populateEvents ({ item, dir, cwd, errors }) {
  if (typeof item === 'string') {
    let name = item
    let src = join(cwd, dir, name)
    return { name, src }
  }
  else if (typeof item === 'object' && !Array.isArray(item)) {
    let name = Object.keys(item)[0]
    let src = item[name].src
      ? join(cwd, item[name].src)
      : join(cwd, dir, name)
    return { name, src }
  }
  errors.push(`Invalid @events or @queues item: ${item}`)
}
