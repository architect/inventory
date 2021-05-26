let populate = require('./populate-lambda')

module.exports = function configureScheduled ({ arc, inventory, errors }) {
  if (!arc.scheduled || !arc.scheduled.length) return null

  let scheduled = populate.scheduled(arc.scheduled, inventory, errors)

  return scheduled
}
