let validate = require('./validate')

module.exports = function configureProxy ({ arc, errors }) {
  if (arc.proxy && !arc.http) {
    errors.push('@proxy requires @http')
    return null
  }
  if (!arc.proxy || !arc.http) return null

  let proxy = {}
  let envs = [ 'testing', 'staging', 'production' ]
  envs.forEach(env => {
    let setting = arc.proxy.find(s => (s[0] && s[0] === env) && s[1])
    if (!setting) errors.push(`@proxy ${env} environment not found or invalid`)
    else proxy[env] = setting[1]
  })

  validate.proxy(proxy, errors)

  return proxy
}
