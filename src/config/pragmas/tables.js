module.exports = function configureTables ({ arc }) {
  if (!arc.tables || !arc.tables.length) return null

  let tables = arc.tables.map(t => {
    if (typeof t === 'object' && !Array.isArray(t)) {
      let name = Object.keys(t)[0]
      let table = {
        name,
        partitionKey: null,
        partitionKeyType: null,
        sortKey: null,
        sortKeyType: null,
        stream: null,
        ttl: null,
        encrypt: null,
        PointInTimeRecovery: null,
      }
      Object.entries(t[name]).forEach(([ key, value ]) => {
        let isStr = typeof value === 'string'
        let pitr = 'PointInTimeRecovery' // It's just so long
        if (isStr && value.startsWith('**')) {
          table.sortKey = key
          table.sortKeyType = value.replace('**', '')
        }
        else if (isStr && value.startsWith('*')) {
          table.partitionKey = key
          table.partitionKeyType = value.replace('*', '')
        }
        if (key === 'stream')   table.stream = value
        if (value === 'TTL')    table.ttl = key
        if (key === 'encrypt')  table.encrypt = value
        if (key === pitr)       table[pitr] = value
        if (key === 'legacy')   table.legacy = value // Arc v5 to v8+ compat
      })

      return table
    }
    throw Error(`Invalid @tables item: ${t}`)
  })

  return tables
}
