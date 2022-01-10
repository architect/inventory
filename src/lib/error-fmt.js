/**
 * Common error formatter
 *
 * @param params {object}
 * @param params.type {string} - Inventory error type: `manifest`, `validation`, or `configuration`
 * @param params.errors {array} - Array of one or more errors to output
 * @param params.inventory {object} - Inventory object
 *
 * @returns Formatted Error + appended ARC_ERRORS property
 */
module.exports = function format (params) {
  let { type, errors } = params
  let output = errors.map(err => `- ${err}`).join('\n')
  let errType = type[0].toUpperCase() + type.substr(1)
  let err = Error(`${errType} error${errors.length > 1 ? 's' : ''}:\n${output}`)
  err.ARC_ERRORS = { type, errors }
  return err
}
