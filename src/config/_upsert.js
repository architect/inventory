/**
 * Overlay / append properties onto an existing config object
 *
 * @param {object} config - An existing Lambda config object
 * @param {object} newConfig - Arc-parsed Lambda config object to be overlaid or appended to `config`
 * @returns {object}
 */
module.exports = function upsertProps (config, newConfig) {
  let props = JSON.parse(JSON.stringify(config))

  for (let setting of newConfig) {
    let name
    let value
    let propIsArray

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
    if (Array.isArray(setting)) {
      // Normalize singular to AWS equivalents
      if (setting[0] === 'policy') setting[0] = 'policies'
      if (setting[0] === 'layer') setting[0] = 'layers'
      name = setting[0]
      value = setting[1]
      propIsArray = name === 'policies' || name === 'layers'
    }
    else if (typeof setting === 'object') {
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
      propIsArray = name === 'policies' || name === 'layers'
    }
    else continue // Technically invalid and should have been caught by parser

    /**
     * Populate default config with new properties
     */
    if (propIsArray) {
      // Value may be a single item or an array
      if (!Array.isArray(value)) value = [ value ]
      if (!props[name]) props[name] = value
      else {
        let values = props[name].concat(value).filter(p => p)
        // Dedupe jic
        props[name] = [ ...new Set(values) ]
      }
    }
    else if (typeof value !== 'undefined') {
      props[name] = value
    }
  }

  return props
}
