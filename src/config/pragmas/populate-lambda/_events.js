let { join } = require('path')
let is = require('../../../lib/is')

module.exports = function populateEvents ({ item, dir, cwd, errors }) {
  if (is.string(item)) {
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
  errors.push(`Invalid @events or @queues item: ${item}`)
}
