let { regex, size, unique } = require('./_lib')

/**
 * Validate Lambdae created by @plugins
 */
module.exports = function validatePlugins (plugins, errors) {
  if (plugins.length) {
    unique(plugins, '@plugins', errors)

    plugins.forEach(plugin => {
      let { name } = plugin
      size(name, 1, 255, '@plugins', errors)
      regex(name, 'veryLooseName', '@plugins', errors)
    })
  }
}
