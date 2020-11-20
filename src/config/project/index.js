let upsert = require('../_upsert')
let read = require('../../read')

/**
 * Get the project-level configuration, overlaying arc.aws settings (if present)
 */
module.exports = function getProjectConfig (params) {
  let { arc, raw, filepath, inventory } = params
  let project = { ...inventory._project }

  if (arc.aws) {
    project.defaultFunctionConfig = upsert(project.defaultFunctionConfig, arc.aws)
  }

  if (filepath) {
    project.manifest = filepath
    // TODO add manifestCreated once we determine we can get birthtime reliably
  }

  // Populate local project configuration
  let prefs = read({ type: 'preferences', cwd: inventory._project.src })
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

    // TODO validate, including / especially env prefs, which could easiyl wind up a funky shape

    project.preferences = {
      ...preferences,
      _arc: prefs.arc,
      _raw: prefs.raw,
    }
    project.preferencesFile = prefs.filepath
  }

  project.arc = arc
  project.raw = raw

  return project
}
