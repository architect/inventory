let { join } = require('path')
let upsert = require('../_upsert')
let prefs = require('./prefs')
let plugins = require('./plugins')
let { is } = require('../../lib')

/**
 * Get the project-level configuration, overlaying arc.aws settings (if present)
 */
module.exports = function getProjectConfig (params) {
  let { arc, errors, raw, filepath, inventory } = params
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
  }

  // Parse local and global project preferences
  let scopes = [ 'global', 'local' ]
  for (let scope of scopes) {
    let p = prefs({ scope, inventory, errors })
    if (p) {
      // Set up the scoped metadata
      project[`${scope}Preferences`] = p.preferences
      project[`${scope}PreferencesFile`] = p.preferencesFile

      // Build out the final preferences
      /* istanbul ignore else: jic */
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
        /* istanbul ignore else: jic */
        if (!project.preferences[pragma]) project.preferences[pragma] = {}
        Object.entries(p.preferences[pragma]).forEach(([ setting, value ]) => {
          project.preferences[pragma][setting] = value
        })
      })
    }
  }

  if (inventory.plugins?._methods) {
    // TODO: project.env = plugins.env(params, project)

    let runtimes = plugins.runtimes(params, project)
    if (runtimes?.runtimes) project.customRuntimes = runtimes.runtimes
    // Compiled runtimes specify build dirs
    if (runtimes?.build) {
      // Since compiled cannot be used with interpreted, we can assume only one plugin
      let runtime = project.customRuntimes.runtimes[0]
      project.build = join(project.cwd, runtimes.build)
      project.defaultFunctionConfig.runtime = runtime
    }
  }

  return project
}
