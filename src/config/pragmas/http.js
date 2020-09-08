let populate = require('./populate-lambda')

module.exports = function configureHTTP ({ arc, inventory }) {
  if (!arc.http || !arc.http.length) return null

  let http = populate.http(arc.http, inventory)

  let hasRoot = http.find(route => route.name === 'get /')
  if (!hasRoot) {
    let root = {
      name: 'get /',
      config: inventory.arc.defaultFunctionConfig,
      src: null,
      handlerFile: null,
      handlerFunction: 'handler',
      configFile: null,
      explicit: false,
      method: 'get',
      path: '/'
    }
    http.unshift(root)
  }

  return http
}
