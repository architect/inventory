let { is } = require('../lib')

/**
 * Overlay / append properties onto an existing config object
 *
 * @param {object} config - An existing Lambda config object
 * @param {object} newConfig - Arc-parsed Lambda config object to be overlaid or appended to `config`
 * @returns {object}
 */
module.exports = function upsertProps (config, newConfig) {
  let props = JSON.parse(JSON.stringify(config))
  let layers = []
  let policies = []

  for (let setting of newConfig) {
    let name
    let value

    /**
     * Normalize singular vs. plural and array vs. object syntax of settings
     *
     * Examples:
     * ---
     * policies foobar
     * → arc.aws: [[ 'policies', 'foobar' ]]
     * ---
     * policies
     *   foobar
     * → arc.aws: [{ policies: [ 'foobar' ] }]
     */
    if (is.array(setting)) {
      // Normalize singular to AWS equivalents
      if (setting[0] === 'policy') setting[0] = 'policies'
      if (setting[0] === 'layer') setting[0] = 'layers'
      name = setting[0]
      value = setting.slice(1)
    }
    else if (is.object(setting)) {
      // Normalize singular to AWS equivalents
      if (setting.policy) {
        setting.policies = setting.policy
        delete setting.policy
      }
      if (setting.layer) {
        setting.layers = setting.layer
        delete setting.layer
      }
      name = Object.keys(setting)[0]
      value = setting[name]
    }
    else continue

    /**
     * Populate default config with new properties
     */
    if (name === 'layers' && !!(value)) {
      layers = layers.concat(value)
    }
    else if (name === 'policies' && !!(value)) {
      policies = policies.concat(value)
    }
    else {
      props[name] = value.length === 1 ? value[0] : value
    }
  }

  // Drop in new (de-duped) layers, but don't unnecessarily overwrite
  if (layers.length) props.layers = [ ...new Set(layers) ]
  if (policies.length) props.policies = [ ...new Set(policies) ]

  return props
}
