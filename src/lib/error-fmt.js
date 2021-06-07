let { basename } = require('path')

/**
 * Common error formatter
 *
 * @param params {object}
 * @param params.type {string} - Inventory error type: `manifest`, `validation`, or `configuration`
 * @param params.errors {array} - Array of one or more errors to output
 * @param params.meta {string} - Appends optional info to primary error message
 * @param params.inventory {object} - Inventory object
 *
 * @returns Formatted Error + appended ARC_ERRORS property
 */
module.exports = function format (params) {
  let { type, errors, meta, inventory } = params
  if (!meta && type === 'validation') {
    meta = inventory._project.manifest
      ? ` in ${basename(inventory._project.manifest)}`
      : ''
  }
  let output = errors.map(err => `- ${err}`).join('\n')
  let errType = type[0].toUpperCase() + type.substr(1)
  let err = Error(`${errType} error${errors.length > 1 ? 's' : ''}${meta ? meta : ''}:\n${output}`)
  err.ARC_ERRORS = params
  return err
}
