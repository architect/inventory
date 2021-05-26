let populate = require('./populate-lambda')

module.exports = function configureQueues ({ arc, inventory, errors }) {
  if (!arc.queues || !arc.queues.length) return null

  let queues = populate.queues(arc.queues, inventory, errors)

  return queues
}
