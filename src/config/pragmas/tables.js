module.exports = function configureTables ({ arc }) {
  if (!arc.tables || !arc.tables.length) return null

  let tables = arc.tables.map(table => {
    if (typeof table === 'object' && !Array.isArray(table)) {
      let name = Object.keys(table)[0]
      let partitionKey = null
      let partitionKeyType = null
      let sortKey = null
      let sortKeyType = null
      let stream = null
      Object.entries(table[name]).forEach(([ key, value ]) => {
        let isStr = typeof value === 'string'
        if (isStr && value.startsWith('**')) {
          sortKey = key
          sortKeyType = value.replace('**', '')
        }
        else if (isStr && value.startsWith('*')) {
          partitionKey = key
          partitionKeyType = value.replace('*', '')
        }
        if (key === 'stream') stream = value
      })
      return {
        name,
        partitionKey,
        partitionKeyType,
        sortKey,
        sortKeyType,
        stream,
      }
    }
    throw Error(`Invalid @tables item: ${table}`)
  })

  return tables
}
