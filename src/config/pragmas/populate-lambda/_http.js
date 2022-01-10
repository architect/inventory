let { getLambdaName } = require('@architect/utils')
let { is, getLambdaDirs } = require('../../../lib')

module.exports = function populateHTTP (params) {
  let { item, errors, plugin } = params
  if (plugin) {
    let { method, path, src } = item
    if (method && path && src) {
      let name = `${method} ${path}`
      let route = { name, ...item, ...getLambdaDirs(params, { plugin }) }
      return route
    }
    errors.push(`Invalid plugin-generated @http route: method: ${method}, path: ${path}, src: ${src}`)
    return
  }
  else if (is.array(item) && item.length === 2) {
    let method = item[0].toLowerCase()
    let path = item[1]
    let name = `${method} ${path}`
    let lambdaName = `${method}${getLambdaName(path)}`
    let dirs = getLambdaDirs(params, { name: lambdaName })
    let route = { name, method, path, ...dirs }
    return route
  }
  else if (is.object(item)) {
    let path = Object.keys(item)[0]
    let method = item[path].method.toLowerCase()
    let name = `${method} ${path}`
    let lambdaName = `${method}${getLambdaName(path)}`
    let dirs = getLambdaDirs(params, { name: lambdaName, customSrc: item[path].src })
    let route = { name, method, path, ...dirs }
    return route
  }
  errors.push(`Invalid @http route: ${item}`)
}
