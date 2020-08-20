let populate = require('./populate-lambda')

module.exports = function configureHTTP ({ arc, inventory }) {
  if (!arc.http || !arc.http.length) return null

  let http = populate.http(arc.http, inventory)

  // TODO handle get /
  let hasRoot = http.find(route => route.name === 'get /')
  if (!hasRoot) {
    let root = {
      name: 'get /',
      config: inventory.arc.defaultFunctionConfig,
      srcDir: null,
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
