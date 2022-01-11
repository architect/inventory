let { is } = require('../../lib')
let validate = require('./validate')

module.exports = function configureTablesIndexes ({ arc, errors }) {
  if (!arc['tables-indexes'] || !arc['tables-indexes'].length) return null
  if (arc['tables-indexes'] && !arc.tables) {
    errors.push(`Specifying @tables-indexes requires specifying corresponding @tables`)
    return null
  }

  let indexes = getIndexes(arc, 'tables-indexes', errors)
  validate.tablesIndexes(indexes, '@tables-indexes', errors)

  return indexes
}

let getIndexes = (arc, pragma, errors) => {
  let isCustomName = key => is.string(key) && key.toLowerCase() === 'name'
  function error (item) { errors.push(`Invalid @${pragma} item: ${item}`) }
  return arc[pragma].map(index => {
    if (is.object(index)) {
      let name = Object.keys(index)[0]
      let partitionKey = null
      let partitionKeyType = null
      let sortKey = null
      let sortKeyType = null
      let indexName = null
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
}
