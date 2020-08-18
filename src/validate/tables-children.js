/**
 * Ensure @tables children (@streams, @indexes) have parent tables present
 * - If not, configuration is invalid
 */
module.exports = function validateTablesChildren (inventory) {
  let { indexes, streams, tables } = inventory
  function check (table, type) {
    if (!tables.some(t => t.name === table)) {
      let msg = `@${type} item missing corresponding table: ${table}`
      throw Error(msg)
    }
  }
  if (streams) {
    streams.forEach(stream => check(stream.table, 'streams'))
  }
  if (indexes) {
    indexes.forEach(index => check(index.name, 'indexes'))
  }
}
