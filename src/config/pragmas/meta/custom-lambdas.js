let populate = require('../populate-lambda')

module.exports = function configureCustomLambdas ({ arc, inventory, errors }) {
  let customLambdaPlugins = inventory.plugins?._methods?.set?.['custom-lambdas']
  if (!customLambdaPlugins?.length) return null

  let customLambdas = populate['custom-lambdas']({ arc, inventory, errors })

  return customLambdas
}
