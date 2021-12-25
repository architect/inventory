let populate = require('./populate-lambda')
let validate = require('./validate')

module.exports = function configureEvents ({ arc, inventory, errors }) {
  let eventsPlugins = inventory.plugins?._methods?.set?.events
  if (!arc?.events?.length && !eventsPlugins?.length) return null

  let events = populate.events({ arc, inventory, errors })

  validate.events(events, '@events', errors)

  return events
}
