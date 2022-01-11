let { unique } = require('./_lib')
let { httpMethods } = require('../../../lib')

module.exports = function validateHTTP (http, errors) {
  if (http?.length) {
    unique(http, '@http routes', errors)

    let validMethod = str => httpMethods.includes(str.toLowerCase())
    let validPath = str => str.match(/^\/[a-zA-Z0-9/\-:._\*]*$/)
    http.forEach(route => {
      let { name, method, path } = route
      if (!validMethod(method)) errors.push(`Invalid @http method: ${name}`)
      if (!validPath(path)) {
        let bad = path.slice().split('').filter(bads)
        let uniq = {}
        bad.forEach(b => { uniq[b] = true })
        bad = Object.keys(uniq).join(', ')
        if (bad.length > 0) {
          errors.push(`Invalid @http path character${bad.length === 1 ? '' : 's'} (${bad}): ${name}`)
        }
      }

      // Conditional for users creating a `get /` function
      if (path.length > 1) {

        // Somehow doesn't start with a slash
        if (path[0] !== '/') {
          errors.push(`Invalid @http path (must start with a slash): ${name}`)
        }

        // Does not end with a slash
        if (path.split('').reverse()[0] === '/') {
          errors.push(`Invalid @http path (cannot end with '/'): ${name}`)
        }

        // Contains double slashes, i.e. //
        if (path.match('//')) {
          errors.push(`Invalid @http path (must have parts between two slashes): ${name}`)
        }

        // No trailing non-alphanumeric characters
        let trailingSpecialChars = path.match(/[-\._]($|\/)/g)
        if (trailingSpecialChars) {
          errors.push(`Invalid @http path (parts cannot end with special characters): ${name}`)
        }
      }

      // Params always include `/:`
      let params = path.match(/\/:/g)
      if (params) {
        // Params cannot have non-alphanumeric characters
        let match = path.match(/\/:[\w.-]+(\/|$)/g)
        if (!match) errors.push(`Invalid @http path (parameters must have only alphanumeric characters): ${name}`)
      }

      // Check to make sure `:` is ONLY used at the beginning of a path part
      let invalidParamSyntax = path.match(/\/\w+:\w*/g)
      if (invalidParamSyntax) {
        errors.push(`Invalid @http path (parameters can only be used at the beginning of a path part): ${name}`)
      }

      // Catchalls must exist at the end of the path
      let invalidCatchallSyntax = path.includes('*') && !path.match(/\/\*$/g)
      if (invalidCatchallSyntax) {
        errors.push(`Invalid @http path (catchalls can only be used at the end of a path): ${name}`)
      }
    })
  }
}

// Paths can only have letters, numbers, dashes, slashes and/or :params
function bads (c) {
  let allowed = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-:._*'.split('')
  return !allowed.includes(c)
}
