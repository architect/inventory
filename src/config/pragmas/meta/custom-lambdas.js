let populate = require('../populate-lambda')

module.exports = function configureCustomLambdas ({ arc, inventory, errors }) {
  let customLambdaPlugins = inventory.plugins?._methods?.set?.customLambdas
  if (!customLambdaPlugins?.length) return null

  let customLambdas = populate.customLambdas({ arc, inventory, errors })

  return customLambdas
}
