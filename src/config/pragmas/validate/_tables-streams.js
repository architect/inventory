let { regex, size, unique } = require('./_lib')

/**
 * Validate @streams (& @tables streams true)
 *
 * Where possible, attempts to follow DynamoDB validation
 * See: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html
 */
module.exports = function validateStreams (streams, errors) {
  if (streams.length) {
    unique(streams, '@streams', errors)

    streams.forEach(stream => {
      let { name } = stream
      size(name, 3, 255, '@streams', errors)
      regex(name, 'veryLooseName', '@streams', errors)
    })
  }
}
