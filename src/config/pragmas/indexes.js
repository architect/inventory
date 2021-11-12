let validate = require('./validate')
let { getIndexes } = require('./tables-indexes')

module.exports = function configureIndexes ({ arc, errors }) {
  if (!arc.indexes || !arc.indexes.length) return null
  if (arc.indexes && !arc.tables) {
    errors.push(`Specifying @indexes requires specifying corresponding @tables`)
    return null
  }
  if (arc['tables-indexes']?.length && arc.indexes?.length) {
    errors.push(`Either @tables-indexes or @indexes can be specified, but not both`)
    return null
  }

  let indexes = getIndexes(arc, 'indexes', errors)
  validate.indexes(indexes, '@indexes', errors)

  return indexes
}
