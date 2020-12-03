let read = require('../../read')
let validate = require('./validate')
let { homedir } = require('os')

module.exports = function getPrefs ({ scope, inventory }) {
  let cwd = scope === 'global'
    ? homedir()
    : inventory._project.src

  // Populate preferences
  let prefs = read({ type: 'preferences', cwd })
  if (prefs.filepath) {
    let preferences = {}
    // Ok, this gets a bit hairy
    // Arc outputs an object of nested arrays
    // Basically, construct a pared-down intermediate prefs obj for consumers
    Object.entries(prefs.arc).forEach(([ key, val ]) => {
      // TODO add additional preferences checks and normalization
      if (!preferences[key]) preferences[key] = {}
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (Array.isArray(v)) {
            if (v.length === 1)       preferences[key] = v[0]
            else if (v.length === 2)  preferences[key][v[0]] = v[1]
            else if (v.length > 2)    preferences[key][v[0]] = [ ...v.slice(1) ]
          }
          else if (typeof v === 'object' && Object.keys(v).length) {
            Object.keys(v).forEach(k => preferences[key][k] = v[k])
          }
          else if (!Array.isArray(v)) preferences[key] = v
        })
      }
      // Turn env vars with spaces into strings
      if (key === 'env') {
        [ 'testing', 'staging', 'production' ].forEach(e => {
          if (preferences.env[e]) {
            Object.entries(preferences.env[e]).forEach(([ key, val ]) => {
              if (Array.isArray(val)) preferences.env[e][key] = val.join(' ')
            })
          }
        })
      }
    })

    validate(preferences)

    return {
      preferences: {
        ...preferences,
        _arc: prefs.arc,
        _raw: prefs.raw,
      },
      preferencesFile: prefs.filepath
    }
  }

  return null
}
