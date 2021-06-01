let read = require('../../read')
let validate = require('./validate')
let { homedir } = require('os')

module.exports = function getPrefs ({ scope, inventory, errors }) {
  let cwd = scope === 'global'
    ? homedir()
    : inventory._project.src

  // Populate preferences
  let prefs = read({ type: 'preferences', cwd, errors })
  if (prefs.filepath) {
    let preferences = {}
    // Ok, this gets a bit hairy
    // Arc outputs an object of nested arrays
    // Basically, construct a pared-down intermediate prefs obj for consumers
    Object.entries(prefs.arc).forEach(([ key, val ]) => {
      // TODO add additional preferences checks and normalization

      /* istanbul ignore else */ // Parser should get this, but jic
      if (!preferences[key]) preferences[key] = {}
      /* istanbul ignore else */ // Parser should only produce arrays, but jic
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (Array.isArray(v)) {
            /* istanbul ignore if */ // Single vals should be strings, but jic
            if (v.length === 1)       preferences[key] = v[0]
            else if (v.length === 2)  preferences[key][v[0]] = v[1]
            /* istanbul ignore else */ // Should be cornered, but jic
            else if (v.length > 2)    preferences[key][v[0]] = [ ...v.slice(1) ]
          }
          else if (typeof v === 'object' && Object.keys(v).length) {
            Object.keys(v).forEach(k => preferences[key][k] = v[k])
          }
          /* istanbul ignore else */ // Should be cornered, but jic
          else if (!Array.isArray(v)) preferences[key] = v
        })
      }
      // Turn env vars with spaces into strings
      if (key === 'env') {
        [ 'testing', 'staging', 'production' ].forEach(e => {
          /* istanbul ignore else */ // Yet another jic
          if (preferences.env[e]) {
            Object.entries(preferences.env[e]).forEach(([ key, val ]) => {
              if (Array.isArray(val)) preferences.env[e][key] = val.join(' ')
            })
          }
        })
      }
      // Turn Sandbox scripts into commands
      if (key === 'sandbox-startup') {
        preferences[key] = val.map(v => {
          if (typeof v === 'string') return v
          /* istanbul ignore else */ // Yet another jic
          if (Array.isArray(v)) return v.join(' ')
        })
      }
    })

    validate(preferences, errors)

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
