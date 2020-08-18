module.exports = function configureIndexes ({ arc }) {
  if (!arc.indexes || !arc.indexes.length) return null

  let indexes = arc.indexes.map(table => {
    if (typeof table === 'object') {
      let name = Object.keys(table)[0]
      let partitionKey = null
      let partitionKeyType = null
      let sortKey = null
      let sortKeyType = null
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
      })
      return {
        name,
        partitionKey,
        partitionKeyType,
        sortKey,
        sortKeyType,
      }
    }
    throw Error(`Invalid @indexes item: ${table}`)
  })

  return indexes
}
