let populate = require('./populate-lambda')

module.exports = function configureHTTP ({ arc, inventory }) {
  // @http get / is inferred by @static
  if (!arc.http && !arc.static) return null

  // Populate normally returns null on an empty Lambda pragma
  // However, @http is special because it gets the Architect Static Asset Proxy (ASAP), so fall back to an empty array
  let http = populate.http(arc.http, inventory) || []

  let findRoot = route => {
    let r = route.name.split(' ')
    let method = r[0]
    let path = r[1]
    let rootParam = path.startsWith('/:') && path.split('/').length === 2
    let isRootMethod = method === 'get' || method === 'any'
    let isRootPath = path === '/' || path === '/*' || rootParam
    return isRootMethod && isRootPath
  }
  let rootHandler = http.some(findRoot) ? 'configured' : 'arcStaticAssetProxy'
  if (rootHandler === 'arcStaticAssetProxy') {
    // Inject ASAP
    let asap = {
      name: 'get /*',
      config: inventory._arc.defaultFunctionConfig,
      src: null,
      handlerFile: null,
      handlerFunction: 'handler',
      configFile: null,
      arcStaticAssetProxy: true,
      method: 'get',
      path: '/*'
    }
    asap.config.views = false
    http.unshift(asap)
  }

  // Impure but it's way less complicated to just do this
  inventory._project.rootHandler = rootHandler

  return http
}
