let populate = require('./populate-other')
let { is, capitalize } = require('../../lib')
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
    projectionType: 'ALL',
    projectionAttributes: null,
  })

  let indexes = []
  let plugins = populate.resources({
    errors,
    template: indexTemplate(),
    plugins: indexesSetters,
    inventory,
    type: 'indexes',
    valid: { name: 'string' },
  })
  if (plugins) indexes.push(...plugins)

  let userland = arc?.[$indexes]?.map(index => {
    if (is.object(index)) {
      let i = indexTemplate()
      i.name = Object.keys(index)[0]
      Object.entries(index[i.name]).forEach(([ key, value ]) => {
        let setting = key?.toLowerCase()
        if (is.sortKey(value)) {
          i.sortKey = key
          i.sortKeyType = value.replace('**', '').toLowerCase()
          if (!i.sortKeyType) i.sortKeyType = 'string'
        }
        else if (is.primaryKey(value)) {
          i.partitionKey = key
          i.partitionKeyType = value.replace('*', '').toLowerCase()
          if (!i.partitionKeyType) i.partitionKeyType = 'string'
        }
        else if (setting === 'name') {
          i.indexName = value
        }
        else if (setting === 'projection') {
          let val = (is.string(value) && value.toLowerCase()) || value
          if (val === 'all') {
            i.projectionType = 'ALL'
          }
          else if (val === 'keys') {
            i.projectionType = 'KEYS_ONLY'
          }
          else {
            i.projectionType = 'INCLUDE'
            if (Array.isArray(value)) {
              i.projectionAttributes = value
            }
            else {
              i.projectionAttributes = [ value ]
            }
          }
        }
      })
      return i
    }
    errors.push(`Invalid @${$indexes} item: ${index}`)
  }).filter(Boolean) // Invalid indexes or plugins may create undefined entries in the map
  if (userland) indexes.push(...userland)

  // Normalize key type casing
  if (indexes.length) indexes = indexes.map(index => {
    let { sortKeyType, partitionKeyType } = index
    if (sortKeyType) index.sortKeyType = capitalize(index.sortKeyType)
    if (partitionKeyType) index.partitionKeyType = capitalize(index.partitionKeyType)
    return index
  })

  validate.tablesIndexes(indexes, '@tables-indexes', errors)

  return indexes
}
