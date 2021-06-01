/**
 * Common error formatter
 *
 * @param message {string} - Primary error message
 * @param errors {array} - Array of one or more errors to output
 * @param meta {string} - Appends optional info to primary error message
 *
 * @returns Formatted error message string
 */
module.exports = function format (message, errors, meta) {
  let output = errors.map(err => `- ${err}`).join('\n')
  return `${message} error${errors.length > 1 ? 's' : ''}${meta ? meta : ''}:\n${output}`
}
