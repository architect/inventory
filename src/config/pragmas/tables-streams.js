let populate = require('./populate-lambda')
let validate = require('./validate')
let is = require('../../lib/is')

/**
 * `@tables-streams`
 * - Originally `@tables {tablename} stream true` created a lambda at src/tables/{tablename}
 * - This was superseded by `@tables-streams`; `@tables` remains for backwards compat and as a convenience for creating `@tables-streams`
 *   - If a project has an existing `@tables` Lambda, we'll continue using that so long as the directory exists
 */
module.exports = function configureTablesStreams ({ arc, inventory, errors }) {
  if (!arc['tables-streams'] && !arc.tables) return null
  if (arc['tables-streams'] && !arc.tables) {
    errors.push(`Specifying @tables-streams requires specifying corresponding @tables`)
    return null
  }

  // Populate @tables
  let tables = arc.tables.filter(t => is.object(t) && t[Object.keys(t)[0]].stream === true)
  if (tables.length) {
    tables = populate.tables(tables, inventory, errors)
  }
  else tables = null

  // Populate @tables-streams
  let streams = populate['tables-streams'](arc['tables-streams'], inventory, errors)

  if (tables && streams) {
    let uniqueTables = tables.filter(t => !streams.some(s => s.table === t.table))
    let merged = streams.concat(uniqueTables)
    validate.tablesStreams(merged, errors)
    return merged
  }
  else if (streams) {
    validate.tablesStreams(streams, errors)
    return streams
  }
  else if (tables) {
    validate.tablesStreams(tables, errors)
    return tables
  }
  return null
}
