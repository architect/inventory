let { join } = require('path')
let { existsSync } = require('fs')
let populate = require('./populate-lambda')

module.exports = function configureHTTP ({ arc, inventory }) {
  if (!arc.http) return null

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
  if (arc.proxy) rootHandler = 'proxy'
  if (rootHandler === 'arcStaticAssetProxy') {
    // Inventory running as an arc/arc dependency (most common use case)
    let src = join(process.cwd(), 'node_modules', '@architect', 'asap', 'dist')
    // Inventory running in arc/arc as a global install
    let global = join(__dirname, '..', '..', '..', '..', 'asap', 'dist')
    // Inventory running from a local (symlink) context (usually testing/dev)
    let local = join(__dirname, '..', '..', '..', 'node_modules', '@architect', 'asap', 'dist')
    if (!existsSync(src) && existsSync(global)) src = global
    else if (!existsSync(src) && existsSync(local)) src = local
    else if (!existsSync(src)) throw ReferenceError('Cannot find Architect Static Asset Proxy dist')

    // Inject ASAP
    let asap = {
      name: 'get /*',
      config: { ...inventory._arc.defaultFunctionConfig },
      src,
      handlerFile: join(src, 'index.js'),
      handlerFunction: 'handler',
      configFile: null,
      arcStaticAssetProxy: true,
      method: 'get',
      path: '/*'
    }
    asap.config.shared = false
    asap.config.views = false
    http.unshift(asap)
  }

  // Impure but it's way less complicated to just do this
  inventory._project.rootHandler = rootHandler

  return http
}
