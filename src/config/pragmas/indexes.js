module.exports = function configureIndexes ({ arc }) {
  if (!arc.indexes || !arc.indexes.length) return null

  let isPrimaryKey = val => val.startsWith('*String') || val.startsWith('*Number')
  let isSortKey = val => val.startsWith('**String') || val.startsWith('**Number')
  let isCustomName = key => key.toLowerCase() === 'name'
  function error (item) { throw Error(`Invalid @indexes item: ${item}`) }

  let indexes = arc.indexes.map(index => {
    if (typeof index === 'object' && !Array.isArray(index)) {
      let name = Object.keys(index)[0]
      let partitionKey = null
      let partitionKeyType = null
      let sortKey = null
      let sortKeyType = null
      let indexName = null
      Object.entries(index[name]).forEach(([ key, value ]) => {
        let isStr = typeof value === 'string'
        if (isStr && isSortKey(value)) {
          sortKey = key
          sortKeyType = value.replace('**', '')
        }
        else if (isStr && isPrimaryKey(value)) {
          partitionKey = key
          partitionKeyType = value.replace('*', '')
        }
        else if (isStr && isCustomName(key)) {
          indexName = value
        }
        else error(index)
      })
      return {
        indexName,
        name,
        partitionKey,
        partitionKeyType,
        sortKey,
        sortKeyType,
      }
    }
    error(index)
  })

  return indexes
}
