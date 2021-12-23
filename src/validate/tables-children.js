/**
 * Ensure @tables children (@tables-streams, @tables-indexes) have parent tables present
 * - If not, configuration is invalid
 */
module.exports = function validateTablesChildren (inventory, errors) {
  let { 'tables-indexes': indexes, 'tables-streams': streams, tables } = inventory

  function check (table, type) {
    if (!tables.some(t => t.name === table)) {
      errors.push(`@${type} ${table} missing corresponding table`)
    }
  }
  if (streams) {
    streams.forEach(stream => check(stream.table, 'tables-streams'))
  }
  if (indexes) {
    indexes.forEach(index => check(index.name, 'tables-indexes'))
  }
}
