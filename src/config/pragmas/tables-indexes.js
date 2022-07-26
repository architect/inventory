let populate = require('./populate-other')
let { is } = require('../../lib')
let validate = require('./validate')

module.exports = function configureTablesIndexes ({ arc, inventory, errors }) {
  let $indexes = 'tables-indexes' // It's quite long!
  let indexesSetters = inventory.plugins?._methods?.set?.[$indexes]
  let tablesSetters = inventory.plugins?._methods?.set?.tables
  if ((!arc[$indexes] || !arc[$indexes].length) && !indexesSetters) return null
  if ((arc[$indexes] || indexesSetters) &&
      (!arc.tables && !tablesSetters)) {
    errors.push(`Specifying @tables-indexes requires specifying corresponding @tables`)
    return null
  }

  let indexTemplate = () => ({
    name: undefined,
    partitionKey: null,
    partitionKeyType: null,
    sortKey: null,
    sortKeyType: null,
    indexName: null,
  })

  let indexes = []
  let plugins = populate.resources({
    errors,
    template: indexTemplate(),
    plugins: indexesSetters,
    inventory,
    type: 'indexes',
    valid: { name: 'string' }
  })
  if (plugins) indexes.push(...plugins)

  let userland = arc?.[$indexes]?.map(index => {
    if (is.object(index)) {
      let i = indexTemplate()
      i.name = Object.keys(index)[0]
      Object.entries(index[i.name]).forEach(([ key, value ]) => {
        if (is.sortKey(value)) {
          i.sortKey = key
          i.sortKeyType = value.replace('**', '')
        }
        else if (is.primaryKey(value)) {
          i.partitionKey = key
          i.partitionKeyType = value.replace('*', '')
        }
        else if (key?.toLowerCase() === 'name') {
          i.indexName = value
        }
      })
      return i
    }
    errors.push(`Invalid @${$indexes} item: ${index}`)
  }).filter(Boolean) // Invalid indexes or plugins may create undefined entries in the map
  if (userland) indexes.push(...userland)

  validate.tablesIndexes(indexes, '@tables-indexes', errors)

  return indexes
}
