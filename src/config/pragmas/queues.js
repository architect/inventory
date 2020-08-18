let populate = require('./populate-lambda')

module.exports = function configureQueues ({ arc, inventory }) {
  if (!arc.queues || !arc.queues.length) return null

  let queues = populate.queues(arc.queues, inventory)

  return queues
}
