module.exports = function configureProxy ({ arc }) {
  if (arc.proxy && !arc.http) throw Error('@proxy requires @http')
  if (!arc.proxy || !arc.http) return null

  let proxy = {}
  let envs = [ 'testing', 'staging', 'production' ]
  envs.forEach(env => {
    let setting = arc.proxy.find(s => {
      return (s[0] && s[0] === env) && s[1]
    })
    if (!setting) throw Error(`@proxy ${env} environment not found`)
    proxy[env] = setting[1]
  })
  return proxy
}
