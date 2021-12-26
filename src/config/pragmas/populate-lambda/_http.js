let { join } = require('path')
let { getLambdaName } = require('@architect/utils')
let { is, normalizeSrc } = require('../../../lib')

module.exports = function populateHTTP ({ item, dir, cwd, errors, plugin }) {
  if (plugin) {
    let { method, path, src } = item
    if (method && path && src) {
      item.src = normalizeSrc(cwd, src)
      let name = `${method} ${path}`
      let route = { name, ...item }
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
    let src = join(cwd, dir, lambdaName)
    let route = { name, method, path, src }
    return route
  }
  else if (is.object(item)) {
    let path = Object.keys(item)[0]
    let method = item[path].method.toLowerCase()
    let name = `${method} ${path}`
    let lambdaName = `${method}${getLambdaName(path)}`
    let src = item[path].src
      ? join(cwd, item[path].src)
      : join(cwd, dir, lambdaName)
    let route = { name, method, path, src }
    return route
  }
  errors.push(`Invalid @http route: ${item}`)
}
