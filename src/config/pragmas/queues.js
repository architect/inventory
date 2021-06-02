let populate = require('./populate-lambda')
let validate = require('./validate')

module.exports = function configureQueues ({ arc, inventory, errors }) {
  if (!arc.queues || !arc.queues.length) return null

  let queues = populate.queues(arc.queues, inventory, errors)

  validate.queues(queues, '@queues', errors)

  return queues
}
