let upsert = require('../_upsert')

module.exports = function configureAWS ({ arc, inventory }) {
  if (!arc.aws) return null

  let aws = upsert(inventory.aws, arc.aws)

  // Allow env var override for AWS_REGION
  aws.region = process.env.AWS_REGION || aws.region

  return aws
}
