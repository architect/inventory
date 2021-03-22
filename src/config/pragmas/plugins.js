let populate = require('./populate-lambda')

module.exports = function configurePlugins ({ arc, inventory }) {
  if (!arc.plugins || !arc.plugins.length) return null

  let plugins = populate.plugins(arc.plugins, inventory)

  return plugins
}
