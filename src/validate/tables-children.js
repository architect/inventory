/**
 * Ensure @tables children (@streams, @indexes) have parent tables present
 * - If not, configuration is invalid
 */
module.exports = function validateTablesChildren (inventory, callback) {
  let { indexes, streams, tables } = inventory
  let err = []

  function check (table, type) {
    if (!tables.some(t => t.name === table)) {
      err.push(`@${type} item missing corresponding table: ${table}`)
    }
  }
  if (streams) {
    streams.forEach(stream => check(stream.table, 'streams'))
  }
  if (indexes) {
    indexes.forEach(index => check(index.name, 'indexes'))
  }

  if (err.length) callback(Error(err.join('\n')))
  else callback()
}
