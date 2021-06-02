let is = require('../../lib/is')
let validate = require('./validate')

module.exports = function configureTables ({ arc, errors }) {
  if (!arc.tables || !arc.tables.length) return null

  let isPrimaryKey = val => val.startsWith('*String') || val.startsWith('*Number')
  let isSortKey = val => val.startsWith('**String') || val.startsWith('**Number')

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
      let PointInTimeRecovery = null
      let legacy
      let pitr = 'PointInTimeRecovery' // It's just so long
      Object.entries(table[name]).forEach(([ key, value ]) => {
        let isStr = typeof value === 'string'
        if (isStr && isSortKey(value)) {
          sortKey = key
          sortKeyType = value.replace('**', '')
        }
        else if (isStr && isPrimaryKey(value)) {
          partitionKey = key
          partitionKeyType = value.replace('*', '')
        }
        if (key === 'stream')   stream = value
        if (value === 'TTL')    ttl = key
        if (key === 'encrypt')  encrypt = value
        if (key === pitr)       PointInTimeRecovery = value
        if (key === 'legacy')   legacy = value // Arc v5 to v8+ compat
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
        PointInTimeRecovery,
      }
      if (legacy !== undefined) t.legacy = legacy
      return t
    }
    errors.push(`Invalid @tables item: ${table}`)
  }).filter(Boolean) // Invalid tables may create undefined entries in the map

  validate.tables(tables, '@tables', errors)

  return tables
}
