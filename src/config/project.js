let upsert = require('./_upsert')

/**
 * Get the project-level configuration, overlaying arc.aws settings (if present)
 */
module.exports = function getProjectConfig (params) {
  let { cwd, arc, raw, filepath, inventory } = params
  let { project } = inventory

  if (arc.aws) {
    project.defaultFunctionConfig = upsert(project.defaultFunctionConfig, arc.aws)
  }

  if (filepath) {
    project.manifest = filepath
    // TODO add manifestCreated once we determine we can get birthtime reliably
  }

  project.src = cwd
  project.arc = arc
  project.raw = raw

  inventory.project = project
  return inventory
}
