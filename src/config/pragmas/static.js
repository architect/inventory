module.exports = function configureStatic ({ arc }) {
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
  let settings = Object.entries(_static).map(([ setting ]) => setting)

  for (let setting of staticPragma) {
    let validSetting = key => settings.some(s => s === key)
    if (setting.ignore) {
      _static.ignore = setting.ignore
    }
    else if (Array.isArray(setting) &&
             setting.length === 2 &&
             validSetting(setting[0])) {
      let isIgnore = setting[0] === 'ignore'
      _static[setting[0]] = isIgnore ? [ setting[1] ] : setting[1]
    }
  }

  return _static
}
