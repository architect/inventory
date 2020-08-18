module.exports = function configureStatic ({ arc }) {
  if (!arc.static || !arc.static.length) return null

  let _static = {
    fingerprint: null,
    folder: null,
    ignore: null,
    prefix: null,
    prune: null,
    spa: null,
    staging: null,
    production: null,
  }
  let settings = Object.entries(_static).map(([ setting ]) => setting)

  for (let setting of arc.static) {
    let validSetting = key => settings.some(s => s === key)
    if (Array.isArray(setting) &&
        setting.length === 2 &&
        validSetting(setting[0]) &&
        _static[setting[0]] === null) {
      _static[setting[0]] = setting[1]
    }
    else if (typeof setting === 'object' && setting.ignore) {
      _static.ignore = setting.ignore
    }
  }

  return _static
}
