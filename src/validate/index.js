let config = require('./config')
let layers = require('./layers')
let tablesChildren = require('./tables-children')
let paths = require('./paths')
let { errorFmt } = require('../lib')

/**
 * Final inventory validation
 */
module.exports = function finalValidation (params, inventory) {
  let errors = []

  /**
   * Deal with vendor configuration errors
   * - Analyze function configuration
   * - Ensure layer configuration will work, AWS blows up with awful errors on this
   * - TODO add deeper policy validation
   */
  config(params, inventory, errors)
  layers(params, inventory, errors)
  if (errors.length) {
    return errorFmt({ type: 'configuration', errors })
  }

  /**
   * Deal with project validation errors
   * - Ensure @tables children (@tables-streams, @tables-indexes) have parent tables present
   */
  tablesChildren(inventory, errors)
  if (errors.length) {
    return errorFmt({ type: 'validation', errors })
  }

  /**
   * File path validation
   * - Ensure all file paths are ascii
   */
  paths(inventory, errors)
  if (errors.length) {
    return errorFmt({ type: 'file path', errors })
  }
}
