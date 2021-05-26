let upsert = require('../_upsert')
let validate = require('./validate')

module.exports = function configureAWS ({ arc, inventory, errors }) {
  if (!arc.aws) return inventory.aws

  let aws = upsert(inventory.aws, arc.aws)

  validate.aws(aws, errors)

  return aws
}
