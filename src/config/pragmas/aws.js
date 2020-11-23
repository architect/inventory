let upsert = require('../_upsert')
let validate = require('./validate')

module.exports = function configureAWS ({ arc, inventory }) {
  if (!arc.aws) return inventory.aws

  let aws = upsert(inventory.aws, arc.aws)

  validate.aws(aws)

  return aws
}
