let populate = require('./populate-lambda')
let validate = require('./validate')

module.exports = function configureScheduled ({ arc, inventory, errors }) {
  if (!arc.scheduled || !arc.scheduled.length) return null

  let scheduled = populate.scheduled(arc.scheduled, inventory, errors)

  validate.scheduled(scheduled, errors)

  return scheduled
}
