let { join } = require('path')
let { getLambdaName } = require('@architect/utils')

module.exports = function populateHTTP ({ item, dir, cwd, errors }) {
  let methods = [ 'get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'any' ]
  let validMethod = str => methods.some(m => m === str.toLowerCase())
  let validPath = str => str.match(/^\/[a-zA-Z0-9/\-:._\*]*$/) // TODO add more validation
  if (Array.isArray(item) && item.length === 2) {
    let method = item[0].toLowerCase()
    let path = item[1]
    let valid = validMethod(method) && validPath(path)
    if (valid) {
      let name = `${method} ${path}`
      let lambdaName = `${method}${getLambdaName(path)}`
      let src = join(cwd, dir, lambdaName)
      let route = { name, method, path, src }
      return route
    }
  }
  else if (typeof item === 'object' && !Array.isArray(item)) {
    let path = Object.keys(item)[0]
    let method = item[path].method.toLowerCase()
    let valid = validMethod(method) && validPath(path)
    if (valid) {
      let name = `${method} ${path}`
      let lambdaName = `${method}${getLambdaName(path)}`
      let src = item[path].src
        ? join(cwd, item[path].src)
        : join(cwd, dir, lambdaName)
      let route = { name, method, path, src }
      return route
    }
  }
  errors.push(`Invalid @http item: ${item}`)
}
