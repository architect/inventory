let { join } = require('path')
let { getLambdaName } = require('@architect/utils')

module.exports = function populateHTTP ({ item, dir, cwd, errors }) {
  if (Array.isArray(item) && item.length === 2) {
    let method = item[0].toLowerCase()
    let path = item[1]
    let name = `${method} ${path}`
    let lambdaName = `${method}${getLambdaName(path)}`
    let src = join(cwd, dir, lambdaName)
    let route = { name, method, path, src }
    return route
  }
  else if (typeof item === 'object' && !Array.isArray(item)) {
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
