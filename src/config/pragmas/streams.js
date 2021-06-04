let populate = require('./populate-lambda')
let validate = require('./validate')

/**
 * `@streams` (formerly `@tables`)
 * - Originally `@tables {tablename} stream true` created a lambda at src/tables/{tablename}
 * - This was superseded by `@streams`; `@tables` remains for backwards compat and as a convenience for creating `@streams`
 *   - If a project has an existing `@tables` Lambda, we'll continue using that so long as the directory exists
 */
module.exports = function configureStreams ({ arc, inventory, errors }) {
  if (!arc.streams && !arc.tables) return null
  if (arc.streams && !arc.tables) {
    errors.push(`Specifying @streams requires specifying corresponding @tables`)
    return null
  }

  // Populate @tables
  let tables = arc.tables.filter(t => typeof t === 'object' && t[Object.keys(t)[0]].stream === true)
  if (tables.length) {
    tables = populate.tables(tables, inventory, errors)
  }
  else tables = null

  // Populate @streams
  let streams = populate.streams(arc.streams, inventory, errors)

  if (tables && streams) {
    let uniqueTables = tables.filter(t => !streams.some(s => s.table === t.table))
    let merged = streams.concat(uniqueTables)
    validate.streams(merged, errors)
    return merged
  }
  else if (streams) {
    validate.streams(streams, errors)
    return streams
  }
  else {
    validate.streams(tables, errors)
    return tables
  }
}
