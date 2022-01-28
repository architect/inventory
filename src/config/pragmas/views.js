let { join } = require('path')
let validate = require('./validate')
let { is } = require('../../lib')

module.exports = function configureViews ({ arc, pragmas, inventory, errors }) {
  if (arc.views && !arc.http) {
    errors.push('@views requires @http')
    return null
  }
  if (!arc.http) return null

  let { cwd, src: projSrc } = inventory._project
  let src = join(projSrc, 'views')
  let views = {
    src,
    views: [] // Revert to null later if none are defined
  }

  // First pass to get + check views folder (if any)
  let foundSrc = false
  if (arc?.views?.length) {
    for (let view of arc.views) {
      if (is.array(view)) {
        let key = view[0]?.toLowerCase()
        if (key === 'src' && is.string(view[1])) {
          views.src = view[1]
          foundSrc = true
          validate.shared(views.src, cwd, errors)
          continue
        }
        if (key === 'src' && !is.string(view[1])) {
          errors.push(`@shared invalid setting: ${key}`)
        }
      }
    }
  }

  // Exit if default views folder doesn't exist
  if (!is.exists(views.src)) return null

  // Proceeding from here resets all views config, so make sure it's only if specific views are specified
  let some = arc.views?.length && !(arc?.views?.length === 1 && foundSrc)
  if (some) {
    // Reset views settings
    for (let route of pragmas.http) {
      route.config.views = false
    }

    // Set new views settings
    for (let view of arc.views) {
      let method = view?.[0]?.toLowerCase()
      let path = view?.[1]
      if (method === 'src') continue
      let name = `${method} ${path}`
      let route = pragmas.http.find(n => n.name === name)
      if (!route) {
        return errors.push(`@views ${name} not found in @http routes`)
      }
      // Ignore views into ASAP
      if (!route.arcStaticAssetProxy) route.config.views = true
    }
  }

  // lambda.config.views was added by Lambda populator defaults, or added above
  for (let { src, config } of pragmas.http) {
    if (config.views === true && !views.views.includes(src)) {
      views.views.push(src)
    }
  }

  return views
}
