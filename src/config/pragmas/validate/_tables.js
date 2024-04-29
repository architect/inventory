let { regex, size, unique } = require('./_lib')
let { deepStrictEqual } = require('assert')

/**
 * Validate @tables + @tables-indexes
 *
 * Where possible, attempts to follow DynamoDB validation
 * See: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html
 */
module.exports = function validateTablesAndIndexes (pragma, pragmaName, errors) {
  if (pragma?.length) {
    pragma.forEach(table => {
      let { name, indexName, partitionKey, partitionKeyType, sortKey } = table

      size(name, 3, 255, pragmaName, errors)
      regex(name, 'veryLooseName', pragmaName, errors)

      if (!partitionKey) errors.push(`Invalid ${pragmaName} item (partition key required): '${name}'`)
      if (!partitionKeyType) errors.push(`Invalid ${pragmaName} item (partition key type required): '${name}'`)
      if (indexName) {
        size(indexName, 3, 255, pragmaName, errors)
        regex(indexName, 'veryLooseName', pragmaName, errors)
      }
      if (partitionKey) {
        size(partitionKey, 1, 255, pragmaName, errors)
        regex(partitionKey, 'veryLooseName', pragmaName, errors)
      }
      if (sortKey) {
        size(sortKey, 1, 255, pragmaName, errors)
        regex(sortKey, 'veryLooseName', pragmaName, errors)
      }
    })

    if (pragmaName === '@tables') {
      unique(pragma, pragmaName, errors)
    }
    else {
      let copy = JSON.parse(JSON.stringify(pragma))
      copy.forEach((index, i) => {
        copy.splice(i, 1)
        let foundDupe = index && copy.some(expect => {
          try {
            deepStrictEqual(index, expect)
            return true
          }
          catch {
            return false
          }
        })
        if (foundDupe) {
          let err = `Duplicate ${pragmaName} value: '${index.name}'`
          if (!errors.includes(err)) errors.push(err)
        }
      })
    }
  }
}
