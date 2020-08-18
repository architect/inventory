let populate = require('./populate-lambda')

module.exports = function configureScheduled ({ arc, inventory }) {
  if (!arc.scheduled || !arc.scheduled.length) return null

  let scheduled = populate.scheduled(arc.scheduled, inventory)

  return scheduled
}
