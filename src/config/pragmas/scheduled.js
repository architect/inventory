let populate = require('./populate-lambda')
let validate = require('./validate')

module.exports = function configureScheduled ({ arc, inventory, errors }) {
  let scheduledPlugins = inventory.plugins?._methods?.set?.scheduled
  if (!arc?.scheduled?.length && !scheduledPlugins?.length) return null

  let scheduled = populate.scheduled({ arc, inventory, errors })

  validate.scheduled(scheduled, errors)

  return scheduled
}
