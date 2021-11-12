/**
 * Ensure @tables children (@tables-streams, @indexes) have parent tables present
 * - If not, configuration is invalid
 */
module.exports = function validateTablesChildren (inventory, errors) {
  let { indexes, 'tables-streams': tablesStreams, tables } = inventory

  function check (table, type) {
    if (!tables.some(t => t.name === table)) {
      errors.push(`@${type} ${table} missing corresponding table`)
    }
  }
  if (tablesStreams) {
    tablesStreams.forEach(stream => check(stream.table, 'tables-streams'))
  }
  if (indexes) {
    indexes.forEach(index => check(index.name, 'indexes'))
  }
}
