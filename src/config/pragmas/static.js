let populate = require('./populate-other')
let { asapSrc, is } = require('../../lib')
let validate = require('./validate')

module.exports = function configureStatic ({ arc, inventory, errors }) {
  let staticSetters = inventory.plugins?._methods?.set?.static
  let httpSetters = inventory.plugins?._methods?.set?.http

  // @static is inferred by @http
  if (!arc.static && !staticSetters && !arc.http && !httpSetters) return null

  let staticPragma = arc.static || []
  let _static = {
    compression: false, // Arc applied default
    fingerprint: null,
    folder: 'public', // Arc applied default
    ignore: null,
    prefix: null,
    prune: null,
    spa: false, // Arc applied default
    staging: null,
    production: null,
  }
  let validSettings = Object.entries(_static).map(([ setting ]) => setting)
  let validSetting = key => validSettings.includes(key)

  if (is.array(arc.static)) {
    let disabled = [ false, 'disable', 'disabled' ]
    let isDisabled = disabled.includes(arc.static[0])
    if (isDisabled) return false
  }

  _static = populate.settings({
    errors,
    settings: _static,
    plugins: staticSetters,
    inventory,
    type: 'static',
  })

  for (let setting of staticPragma) {
    // The ignore setting can come in one of two shapes, handle both
    let ignore

    // Ignore is a named vector
    if (setting.ignore) {
      ignore = setting.ignore
    }
    // Plain vector settings
    else if (is.array(setting) && validSetting(setting[0])) {
      if (setting[0] === 'ignore') ignore = setting.slice(1)
      else _static[setting[0]] = setting[1]
    }

    // Merge manifest + plugin ignore patterns
    if (ignore) {
      _static.ignore = _static.ignore
        ? [ ...new Set([ ..._static.ignore, ...setting.ignore ]) ] // De-dupe
        : ignore
    }
  }

  // Handy shortcut to ASAP for bare @static
  if (!arc.http && !httpSetters) {
    inventory._project.rootHandler = 'arcStaticAssetProxy'
    inventory._project.asapSrc = asapSrc()
  }

  validate.static(_static, errors)

  return _static
}
