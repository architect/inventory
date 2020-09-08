let populate = require('./populate-lambda')

module.exports = function configureHTTP ({ arc, inventory }) {
  // @http get / is inferred by @static
  if (!arc.http && !arc.static) return null

  // Populate normally returns null on an empty Lambda pragma
  // However, @http is special bc $default handler, so fall back to an empty array
  let http = populate.http(arc.http, inventory) || []

  let hasRoot = http && http.find(route => route.name === 'get /')
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
