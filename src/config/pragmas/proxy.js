let populate = require('./populate-other')
let validate = require('./validate')

module.exports = function configureProxy ({ arc, inventory, errors }) {
  let proxySetters = inventory.plugins?._methods?.set?.proxy
  let httpSetters = inventory.plugins?._methods?.set?.http
  if ((arc.proxy || proxySetters) &&
      (!arc.http && !httpSetters)) {
    errors.push('Specifying @proxy requires specifying @http')
    return null
  }
  if (!arc.proxy && !proxySetters) return null

  let proxy = {
    testing: null,
    staging: null,
    production: null,
  }

  proxy = populate.settings({
    errors,
    settings: proxy,
    plugins: proxySetters,
    inventory,
    type: 'proxy',
    valid: {
      testing: 'string',
      staging: 'string',
      production: 'string',
    },
  })
  if (proxy === null) return null

  if (arc?.proxy?.length) {
    Object.keys(proxy).forEach(env => {
      let setting = arc.proxy.find(s => (s[0] && s[0] === env) && s[1])
      if (!setting) errors.push(`@proxy ${env} environment not found or invalid`)
      else proxy[env] = setting[1]
    })
  }

  validate.proxy(proxy, errors)

  return proxy
}
