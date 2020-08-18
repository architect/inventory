let { join } = require('path')
let { existsSync } = require('fs')

module.exports = function populateStreams ({ type, item, dir }) {
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
      let legacySrcDir = join(process.cwd(), dir, name)
      let streamSrcDir = join(process.cwd(), 'src', 'streams', name)
      let srcDir = existsSync(legacySrcDir) ? legacySrcDir : streamSrcDir
      let table = name
      return { name, srcDir, table }
    }
  }
  else if (typeof item === 'string' && type === 'streams') {
    let name = item
    let srcDir = join(process.cwd(), dir, name)
    let table = name
    return { name, srcDir, table }
  }
  else if (typeof item === 'object' && !Array.isArray(item) && type === 'streams') {
    let name = Object.keys(item)[0]
    let srcDir = item[name].path
      ? join(process.cwd(), item[name].path)
      : join(process.cwd(), dir, name)
    let table = item[name].table
      ? item[name].table
      : name
    return { name, srcDir, table }
  }
  throw Error(`Invalid @${type} item: ${item}`)
}
