let { join } = require('path')
let { existsSync } = require('fs')

module.exports = function populateStreams ({ type, item, dir, cwd }) {
  let isObj = typeof item === 'object' && !Array.isArray(item)
  if (type === 'tables' && isObj) {
    let name = Object.keys(item)[0]
    // Check for the legacy dir from before `@tables tablename stream true` generated an @streams item
    let legacySrc = join(cwd, dir, name)
    let streamSrc = join(cwd, 'src', 'streams', name)
    let src = existsSync(legacySrc) ? legacySrc : streamSrc
    let table = name
    return { name, src, table }
  }
  else if (type === 'streams' && typeof item === 'string') {
    let name = item
    let src = join(cwd, dir, name)
    let table = name
    return { name, src, table }
  }
  else if (type === 'streams' && isObj) {
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
