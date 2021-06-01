let errorFmt = require('../lib/error-fmt')

/**
 * Ensure @tables children (@streams, @indexes) have parent tables present
 * - If not, configuration is invalid
 */
module.exports = function validateTablesChildren (inventory, callback) {
  let { indexes, streams, tables } = inventory
  let errors = []

  function check (table, type) {
    if (!tables.some(t => t.name === table)) {
      errors.push(`@${type} ${table} missing corresponding table`)
    }
  }
  if (streams) {
    streams.forEach(stream => check(stream.table, 'streams'))
  }
  if (indexes) {
    indexes.forEach(index => check(index.name, 'indexes'))
  }

  if (errors.length) {
    let msg = errorFmt('Table configuration', errors)
    callback(Error(msg))
  }
  else callback()
}
