let runtimes = require('./runtimes')
let layers = require('./layers')
let tablesChildren = require('./tables-children')
let errorFmt = require('../lib/error-fmt')

/**
 * Final inventory validation
 */
module.exports = function finalValidation (params, inventory) {
  let errors = []

  /**
   * Deal with vendor configuration errors
   */

  // Blow up on any non-matching runtimes
  runtimes(params, inventory, errors)

  // Ensure layer configuration will work, AWS blows up with awful errors on this
  layers(params, inventory, errors)

  // TODO add deeper policy validation here

  if (errors.length) {
    return errorFmt({
      type: 'configuration',
      errors,
      inventory,
    })
  }

  /**
   * Deal with project validation errors
   */

  // Ensure @tables children (@streams, @indexes) have parent tables present
  tablesChildren(inventory, errors)

  if (errors.length) {
    return errorFmt({
      type: 'validation',
      errors,
      inventory,
    })
  }
}
