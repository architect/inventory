let aws = require('./_aws')
let { patterns, regex, size } = require('./_meta')

module.exports = {
  // Pragmas and project validation
  aws,

  // TODO prime refactor candidate as we get deeper into validation:
  // Meta
  patterns,
  validate: {
    regex,
    size
  },
}
