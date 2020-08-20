let { join } = require('path')
let { existsSync } = require('fs')

module.exports = function populateStreams ({ type, item, dir, cwd }) {
  if (type === 'tables') {
    let name
    if (typeof item === 'string') {
      name = item
    }
    if (typeof item === 'object' && !Array.isArray(item)) {
      name = Object.keys(item)[0]
    }
    if (name) {
      // Check for the legacy dir from before `@tables tablename stream true` generated an @streams item
      let legacySrc = join(cwd, dir, name)
      let streamSrc = join(cwd, 'src', 'streams', name)
      let src = existsSync(legacySrc) ? legacySrc : streamSrc
      let table = name
      return { name, src, table }
    }
  }
  else if (typeof item === 'string' && type === 'streams') {
    let name = item
    let src = join(cwd, dir, name)
    let table = name
    return { name, src, table }
  }
  else if (typeof item === 'object' && !Array.isArray(item) && type === 'streams') {
    let name = Object.keys(item)[0]
    let src = item[name].src
      ? join(cwd, item[name].src)
      : join(cwd, dir, name)
    let table = item[name].table
      ? item[name].table
      : name
    return { name, src, table }
  }
  throw Error(`Invalid @${type} item: ${item}`)
}
