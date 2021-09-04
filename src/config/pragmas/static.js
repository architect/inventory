let asapSrc = require('../../lib/asap-src')
let is = require('../../lib/is')

module.exports = function configureStatic ({ arc, inventory }) {
  // @static is inferred by @http
  if (!arc.static && !arc.http) return null

  let staticPragma = arc.static || []
  let _static = {
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
    let isDisabled = disabled.some(s => s === arc.static[0])
    if (isDisabled) return false
  }

  let settings = Object.entries(_static).map(([ setting ]) => setting)
  for (let setting of staticPragma) {
    let validSetting = key => settings.some(s => s === key)
    if (setting.ignore) {
      _static.ignore = setting.ignore
    }
    else if (is.array(setting) &&
             setting.length === 2 &&
             validSetting(setting[0])) {
      let isIgnore = setting[0] === 'ignore'
      _static[setting[0]] = isIgnore ? [ setting[1] ] : setting[1]
    }
  }

  // Handy shortcut to ASAP for bare @static
  if (!arc.http) {
    inventory._project.rootHandler = 'arcStaticAssetProxy'
    inventory._project.asapSrc = asapSrc()
  }

  return _static
}
