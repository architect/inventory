let { join } = require('path')

module.exports = function populateEvents ({ item, dir, cwd }) {
  if (typeof item === 'string') {
    let name = item
    let srcDir = join(cwd, dir, name)
    return { name, srcDir }
  }
  else if (typeof item === 'object') {
    let name = Object.keys(item)[0]
    let srcDir = item[name].path
      ? join(cwd, item[name].path)
      : join(cwd, dir, name)
    return { name, srcDir }
  }
  throw Error(`Invalid @events or @queues item: ${item}`)
}
