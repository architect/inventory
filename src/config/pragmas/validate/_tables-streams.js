let { regex, size, unique } = require('./_lib')

/**
 * Validate @tables-streams (& @tables streams true)
 *
 * Where possible, attempts to follow DynamoDB validation
 * See: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html
 */
module.exports = function validateTablesStreams (tablesStreams, errors) {
  unique(tablesStreams, '@tables-streams', errors)

  tablesStreams.forEach(stream => {
    let { name } = stream
    size(name, 3, 255, '@tables-streams', errors)
    regex(name, 'veryLooseName', '@tables-streams', errors)
  })
}
