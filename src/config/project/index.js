let { join } = require('path')
let upsert = require('../_upsert')
let prefs = require('./prefs')
let plugins = require('./plugins')
let { is, mergeEnvVars } = require('../../lib')

/**
 * Get the project-level configuration, overlaying arc.aws settings (if present)
 */
module.exports = function getProjectConfig (params) {
  let { arc, errors, raw, filepath, inventory } = params
  let _project = {
    ...inventory._project,
    arc,
    raw,
  }

  if (arc.aws) {
    _project.defaultFunctionConfig = upsert(_project.defaultFunctionConfig, arc.aws)
  }

  if (filepath) {
    _project.manifest = filepath
  }

  // Parse local and global project preferences
  let scopes = [ 'global', 'local' ]
  for (let scope of scopes) {
    let p = prefs({ scope, inventory, errors })
    if (p) {
      // Set up the scoped metadata
      _project[`${scope}Preferences`] = p.preferences
      _project[`${scope}PreferencesFile`] = p.preferencesFile

      // Build out the final preferences
      /* istanbul ignore else: jic */
      if (!_project.preferences) _project.preferences = {}
      Object.keys(p.preferences).forEach(pragma => {
        // Ignore the raw data
        if (pragma === '_arc' || pragma === '_raw') return
        // Allow booleans, etc.
        if (!is.object(p.preferences[pragma])) {
          _project.preferences[pragma] = p.preferences[pragma]
          return
        }
        // Traverse and merge individual settings
        /* istanbul ignore else: jic */
        if (!_project.preferences[pragma]) _project.preferences[pragma] = {}
        Object.entries(p.preferences[pragma]).forEach(([ setting, value ]) => {
          _project.preferences[pragma][setting] = value
        })
      })
    }
  }

  // Populate local env from preferences
  if (_project.preferences?.env) {
    _project.env.local = _project.preferences.env
  }

  if (inventory.plugins?._methods) {
    _project.env.plugins = plugins.env(params, _project)
    _project.env.local = mergeEnvVars({
      name: 'Local',
      source: _project.env.plugins,
      target: _project.env.local,
      errors,
    })

    let { build, runtimes } = plugins.runtimes(params, _project)
    if (build) _project.build = join(_project.cwd, build)
    if (runtimes) _project.customRuntimes = runtimes
  }

  return _project
}
