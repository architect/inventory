let populate = require('./populate-other')
let { is, capitalize } = require('../../lib')
let validate = require('./validate')

module.exports = function configureTables ({ arc, inventory, errors }) {
  let tablesSetters = inventory.plugins?._methods?.set?.tables
  if ((!arc.tables || !arc.tables.length) && !tablesSetters) return null

  let pitrLong = 'PointInTimeRecovery' // It's just so long
  let tableTemplate = () => ({
    name: undefined,
    partitionKey: null,
    partitionKeyType: null,
    sortKey: null,
    sortKeyType: null,
    stream: null,
    ttl: null,
    encrypt: null,
    pitr: null,
  })

  let tables = []
  let plugins = populate.resources({
    errors,
    template: tableTemplate(),
    plugins: tablesSetters,
    inventory,
    type: 'tables',
    valid: { name: 'string' },
  })
  if (plugins) tables.push(...plugins)

  let userland = arc?.tables?.map(table => {
    if (is.object(table)) {
      let t = tableTemplate()
      t.name = Object.keys(table)[0]
      Object.entries(table[t.name]).forEach(([ key, value ]) => {
        if (is.sortKey(value)) {
          t.sortKey = key
          t.sortKeyType = value.replace('**', '').toLowerCase()
          if (!t.sortKeyType) t.sortKeyType = 'string'
        }
        else if (is.primaryKey(value)) {
          t.partitionKey = key
          t.partitionKeyType = value.replace('*', '').toLowerCase()
          if (!t.partitionKeyType) t.partitionKeyType = 'string'
        }
        if (key === 'stream')   t.stream = value
        if (value === 'TTL')    t.ttl = key
        if (value === 'ttl')    t.ttl = key
        if (key === 'encrypt')  t.encrypt = value
        if (key === 'PITR')     t.pitr = value
        if (key === 'pitr')     t.pitr = value
        if (key === pitrLong)   t.PointInTimeRecovery = value
      })
      return t
    }
    errors.push(`Invalid @tables item: ${table}`)
  }).filter(Boolean) // Invalid tables or plugins may create undefined entries in the map
  if (userland) tables.push(...userland)

  // Normalize key type casing
  if (tables.length) tables = tables.map(table => {
    let { sortKeyType, partitionKeyType } = table
    if (sortKeyType) table.sortKeyType = capitalize(table.sortKeyType)
    if (partitionKeyType) table.partitionKeyType = capitalize(table.partitionKeyType)
    return table
  })

  validate.tables(tables, '@tables', errors)

  return tables
}
