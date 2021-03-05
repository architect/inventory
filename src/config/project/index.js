let upsert = require('../_upsert')
let prefs = require('./prefs')
let is = require('../../lib/is')
let plugins = require('./plugins')

/**
 * Get the project-level configuration, overlaying arc.aws settings (if present)
 */
module.exports = function getProjectConfig (params) {
  let { arc, raw, filepath, inventory } = params
  let project = {
    ...inventory._project,
    arc,
    raw,
  }

  if (arc.aws) {
    project.defaultFunctionConfig = upsert(project.defaultFunctionConfig, arc.aws)
  }

  if (filepath) {
    project.manifest = filepath
    // TODO add manifestCreated once we determine we can get birthtime reliably
  }

  // require project plugin modules
  project.plugins = plugins(project)

  // parse local and global arc preferences
  let scopes = [ 'global', 'local' ]
  for (let scope of scopes) {
    let p = prefs({ scope, inventory })
    if (p) {
      // Set up the scoped metadata
      project[`${scope}Preferences`] = p.preferences
      project[`${scope}PreferencesFile`] = p.preferencesFile

      // Build out the final preferences
      if (!project.preferences) project.preferences = {}
      Object.keys(p.preferences).forEach(pragma => {
        // Ignore the raw data
        if (pragma === '_arc' || pragma === '_raw') return
        // Allow booleans, etc.
        if (!is.object(p.preferences[pragma])) {
          project.preferences[pragma] = p.preferences[pragma]
          return
        }
        // Traverse and merge individual settings
        if (!project.preferences[pragma]) project.preferences[pragma] = {}
        Object.entries(p.preferences[pragma]).forEach(([ setting, value ]) => {
          project.preferences[pragma][setting] = value
        })
      })
    }
  }

  return project
}
