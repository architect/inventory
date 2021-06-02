let populate = require('./populate-lambda')
let validate = require('./validate')

module.exports = function configureEvents ({ arc, inventory, errors }) {
  if (!arc.events || !arc.events.length) return null

  let events = populate.events(arc.events, inventory, errors)

  validate.events(events, '@events', errors)

  return events
}
