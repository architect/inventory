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

  let settings = Object.entries(_static).map(([ setting ]) => setting)
  let validSetting = key => settings.includes(key)
  for (let setting of staticPragma) {
    // The ignore setting can come in a couple shapes, so we have to handle those
    if (setting.ignore) {
      _static.ignore = setting.ignore
    }
    else if (is.array(setting) && validSetting(setting[0])) {
      _static[setting[0]] = setting[0] === 'ignore' ? [ ...setting.slice(1) ] : setting[1]
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
