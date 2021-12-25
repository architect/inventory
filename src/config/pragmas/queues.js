let populate = require('./populate-lambda')
let validate = require('./validate')

module.exports = function configureQueues ({ arc, inventory, errors }) {
  let queuesPlugins = inventory.plugins?._methods?.set?.queues
  if (!arc?.queues?.length && !queuesPlugins?.length) return null

  let queues = populate.queues({ arc, inventory, errors })

  validate.queues(queues, '@queues', errors)

  return queues
}
