let { join } = require('path')
let { existsSync } = require('fs')
let { is, normalizeSrc } = require('../../../lib')

module.exports = function populateTablesStreams ({ type, item, dir, cwd, errors, plugin }) {
  if (type === 'tables' && is.object(item)) {
    let name = Object.keys(item)[0]
    // Check for the legacy dir from before `@tables tablename stream true` generated a @tables-streams item
    let legacySrc = join(cwd, dir, name)
    let streamSrc = join(cwd, 'src', 'streams', name)
    let tablesStreamsSrc = join(cwd, 'src', 'tables-streams', name)

    let src
    if      (existsSync(legacySrc)) src = legacySrc
    else if (existsSync(streamSrc)) src = streamSrc // TODO [remove] in 10.0
    else                            src = tablesStreamsSrc

    let table = name
    return { name, src, table }
  }
  else if (type === 'tables-streams' && plugin) {
    let { name, src, table } = item
    if (name && src && table) {
      item.src = normalizeSrc(cwd, src)
      return item
    }
    errors.push(`Invalid plugin-generated @${type} item: name: ${name}, table: ${table}, src: ${src}`)
    return
  }
  else if (type === 'tables-streams' && is.string(item)) {
    let name = item
    let src = join(cwd, dir, name)
    let table = name
    return { name, src, table }
  }
  else if (type === 'tables-streams' && is.object(item)) {
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
