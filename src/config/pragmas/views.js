module.exports = function configureViews ({ arc, pragmas }) {
  if (arc.views && !arc.http) throw Error('@views requires @http')
  if (!arc.http) return null

  let views = []
  if (arc.views) {
    // Reset views settings
    for (let route of pragmas.http) {
      route.config.views = false
    }
    // Set new views settings
    for (let view of arc.views) {
      let method = view[0].toLowerCase()
      let path = view[1]
      let name = `${method} ${path}`
      let route = pragmas.http.find(n => n.name === name)
      if (!route) {
        throw Error(`@views ${name} not found in @http routes`)
      }
      // Ignore views into ASAP
      if (!route.arcStaticAssetProxy) route.config.views = true
    }
  }
  for (let { name, config } of pragmas.http) {
    if (config.views === true) {
      views.push(name)
    }
  }
  return views.length ? views : null
}
