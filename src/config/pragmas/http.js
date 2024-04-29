let { join } = require('path')
let populate = require('./populate-lambda')
let { asapSrc } = require('../../lib')
let validate = require('./validate')
let sort = require('./sort/http')

module.exports = function configureHTTP ({ arc, inventory, errors }) {
  let httpPlugins = inventory.plugins?._methods?.set?.http
  if (!arc.http && !httpPlugins?.length) return null

  // Populate normally returns null on an empty Lambda pragma
  // However, @http is special because it gets the Architect Static Asset Proxy (ASAP), so fall back to an empty array
  let http = populate.http({ arc, inventory, errors }) || []

  // Attempt to determine specifically what is handling requests to the root
  // This should probably just be replaced by proper route ordering
  let rootHandler
  if (arc.proxy) {
    rootHandler = 'proxy'
  }
  else {
    let foundHandler
    for (let route of http) {
      let { method, path } = route
      let rootParam = path.startsWith('/:') && path.split('/').length === 2
      let isRootMethod = method === 'get' || method === 'any'
      let isRootPath = path === '/' || path === '/*' || rootParam
      // Prefer `/` to `/*` or `/:foo`; then prefer `get` to `any`
      if (isRootMethod && isRootPath) {
        if (!foundHandler) foundHandler = route
        else {
          let pathLen = path.startsWith('/:') ? 2 : path.length
          let handLen = foundHandler.path.startsWith('/:') ? 2 : foundHandler.path.length
          // root wins over params / catchall
          if (pathLen < handLen) {
            foundHandler = route
          }
          // `get` wins over `any`
          else if (method === 'get' && (pathLen <= handLen)) {
            foundHandler = route
          }
        }
      }
    }
    if (foundHandler) rootHandler = foundHandler.name
  }

  // Inject ASAP
  if (!rootHandler) {
    rootHandler = 'arcStaticAssetProxy'
    let src = asapSrc()
    let asap = {
      name: 'get /*',
      config: { ...inventory._arc.defaultFunctionConfig },
      src,
      handlerFile: join(src, 'index.js'),
      handlerMethod: 'handler',
      configFile: null,
      arcStaticAssetProxy: true,
      pragma: 'http',
      method: 'get',
      path: '/*',
    }
    asap.config.shared = false
    asap.config.views = false
    inventory._project.asapSrc = src // Handy shortcut to ASAP
    http.unshift(asap)
  }

  // Impure but it's way less complicated to just do this
  inventory._project.rootHandler = rootHandler

  // Final steps: validate, then ensure the route order works as API Gateway would
  validate.http(http, errors)
  http = sort(http)

  return http
}
