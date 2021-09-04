let { join } = require('path')
let { existsSync } = require('fs')
let is = require('../../../lib/is')

module.exports = function populateStreams ({ type, item, dir, cwd, errors }) {
  if (type === 'tables' && is.object(item)) {
    let name = Object.keys(item)[0]
    // Check for the legacy dir from before `@tables tablename stream true` generated an @streams item
    let legacySrc = join(cwd, dir, name)
    let streamSrc = join(cwd, 'src', 'streams', name)
    let src = existsSync(legacySrc) ? legacySrc : streamSrc
    let table = name
    return { name, src, table }
  }
  else if (type === 'streams' && is.string(item)) {
    let name = item
    let src = join(cwd, dir, name)
    let table = name
    return { name, src, table }
  }
  else if (type === 'streams' && is.object(item)) {
    let name = Object.keys(item)[0]
    let src = item[name].src
      ? join(cwd, item[name].src)
      : join(cwd, dir, name)
    let table = item[name].table
      ? item[name].table
      : name
    return { name, src, table }
  }
  errors.push(`Invalid @${type} item: ${item}`)
}
