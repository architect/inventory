let is = require('../../lib/is')
let validate = require('./validate')

module.exports = function configureIndexes ({ arc, errors }) {
  if (!arc.indexes || !arc.indexes.length) return null

  let isPrimaryKey = val => val.startsWith('*String') || val.startsWith('*Number')
  let isSortKey = val => val.startsWith('**String') || val.startsWith('**Number')
  let isCustomName = key => key.toLowerCase() === 'name'
  function error (item) { errors.push(`Invalid @indexes item: ${item}`) }

  let indexes = arc.indexes.map(index => {
    if (is.object(index)) {
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
  }).filter(Boolean) // Invalid indexes may create undefined entries in the map

  validate.indexes(indexes, '@indexes', errors)

  return indexes
}
