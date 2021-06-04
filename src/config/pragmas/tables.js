let is = require('../../lib/is')
let validate = require('./validate')

module.exports = function configureTables ({ arc, errors }) {
  if (!arc.tables || !arc.tables.length) return null

  let pitrLong = 'PointInTimeRecovery' // It's just so long

  let tables = arc.tables.map(table => {
    if (is.object(table)) {
      let name = Object.keys(table)[0]
      let partitionKey = null
      let partitionKeyType = null
      let sortKey = null
      let sortKeyType = null
      let stream = null
      let ttl = null
      let encrypt = null
      let pitr = null
      let pitrOld // Old opt, remove in some future breaking change
      let legacy // Arc v5 to v8+ compat flag
      Object.entries(table[name]).forEach(([ key, value ]) => {
        if (is.sortKey(value)) {
          sortKey = key
          sortKeyType = value.replace('**', '')
        }
        else if (is.primaryKey(value)) {
          partitionKey = key
          partitionKeyType = value.replace('*', '')
        }
        if (key === 'stream')   stream = value
        if (value === 'TTL')    ttl = key
        if (key === 'encrypt')  encrypt = value
        if (key === 'pitr')     pitr = value
        if (key === pitrLong)   pitrOld = value
        if (key === 'legacy')   legacy = value
      })
      let t = {
        name,
        partitionKey,
        partitionKeyType,
        sortKey,
        sortKeyType,
        stream,
        ttl,
        encrypt,
        pitr,
      }
      if (legacy !== undefined) t.legacy = legacy
      if (pitrOld !== undefined) t.PointInTimeRecovery = pitrOld
      return t
    }
    errors.push(`Invalid @tables item: ${table}`)
  }).filter(Boolean) // Invalid tables may create undefined entries in the map

  validate.tables(tables, '@tables', errors)

  return tables
}
