let upsert = require('../_upsert')

module.exports = function configureAWS ({ arc, inventory }) {
  if (!arc.aws) return inventory.aws

  let aws = upsert(inventory.aws, arc.aws)

  return aws
}
