let { is, getLambdaDirs } = require('../../../lib')
let ts = 'tables-streams'

module.exports = function populateTablesStreams (params) {
  let { type, item, errors, plugin } = params
  if (type === 'tables' && is.object(item)) {
    let name = Object.keys(item)[0]
    let table = name
    let dirs = getLambdaDirs({ ...params, type: ts }, { name })
    return { name, table, ...dirs }
  }
  else if (type === ts && plugin) {
    let { name, src, table } = item
    if (name && src && table) {
      return { ...item, ...getLambdaDirs(params, { plugin }) }
    }
    errors.push(`Invalid plugin-generated @${type} item: name: ${name}, table: ${table}, src: ${src}`)
    return
  }
  else if (type === ts && is.string(item)) {
    let name = item
    let table = name
    let dirs = getLambdaDirs(params, { name })
    return { name, table, ...dirs }
  }
  else if (type === ts && is.object(item)) {
    let name = Object.keys(item)[0]
    let table = item[name].table
      ? item[name].table
      : name
    let dirs = getLambdaDirs(params, { name, customSrc: item[name].src })
    return { name, table, ...dirs }
  }
  errors.push(`Invalid @${type} item: ${item}`)
}
