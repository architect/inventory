let populate = require('./populate-lambda')
let validate = require('./validate')

module.exports = function configurePlugins ({ arc, inventory, errors }) {
  if (!arc.plugins || !arc.plugins.length) return null

  let plugins = populate.plugins(arc.plugins, inventory, errors)

  validate.plugins(plugins, errors)

  return plugins
}
