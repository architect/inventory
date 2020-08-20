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
    if (setting.ignore) {
      _static.ignore = setting.ignore
    }
    else if (Array.isArray(setting) &&
        setting.length === 2 &&
        validSetting(setting[0]) &&
        _static[setting[0]] === null) {
      let isIgnore = setting[0] === 'ignore'
      _static[setting[0]] = isIgnore ? [ setting[1] ] : setting[1]
    }
  }

  return _static
}
