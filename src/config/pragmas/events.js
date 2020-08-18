let populate = require('./populate-lambda')

module.exports = function configureEvents ({ arc, inventory }) {
  if (!arc.events || !arc.events.length) return null

  let events = populate.events(arc.events, inventory)

  return events
}
