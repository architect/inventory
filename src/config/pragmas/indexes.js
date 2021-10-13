let is = require('../../lib/is')
let validate = require('./validate')

module.exports = function configureIndexes ({ arc, errors }) {
  if (!arc.indexes || !arc.indexes.length) return null
  if (arc.indexes && !arc.tables) {
    errors.push(`Specifying @indexes requires specifying corresponding @tables`)
    return null
  }

  let isCustomName = key => is.string(key) && key.toLowerCase() === 'name'
  let isProjection = key => is.string(key) && key.toLowerCase() === 'projection'
  function error (item) { errors.push(`Invalid @indexes item: ${item}`) }

  let indexes = arc.indexes.map(index => {
    if (is.object(index)) {
      let name = Object.keys(index)[0]
      let partitionKey = null
      let partitionKeyType = null
      let sortKey = null
      let sortKeyType = null
      let indexName = null
      let projectionType = 'ALL'
      let projectionAttributes = null
      Object.entries(index[name]).forEach(([ key, value ]) => {
        if (is.sortKey(value)) {
          sortKey = key
          sortKeyType = value.replace('**', '')
        }
        else if (is.primaryKey(value)) {
          partitionKey = key
          partitionKeyType = value.replace('*', '')
        }
        else if (isCustomName(key)) {
          indexName = value
        }
        else if (isProjection(key)) {
          if (value === 'all') {
            projectionType = 'ALL'
          }
          else if (value === 'keys') {
            projectionType = 'KEYS_ONLY'
          }
          else {
            projectionType = 'INCLUDE'
            if (Array.isArray(value)) {
              projectionAttributes = value
            }
            else {
              projectionAttributes = [ value ]
            }
          }
        }
      })
      return {
        indexName,
        name,
        partitionKey,
        partitionKeyType,
        sortKey,
        sortKeyType,
        projectionType,
        projectionAttributes
      }
    }
    error(index)
  }).filter(Boolean) // Invalid indexes may create undefined entries in the map

  validate.indexes(indexes, '@indexes', errors)

  return indexes
}
