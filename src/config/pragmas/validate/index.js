let aws = require('./_aws')
let shared = require('./_shared')
let { patterns, regex, size } = require('./_meta')

module.exports = {
  // Pragmas and project validation
  aws,
  shared, // Also includes views

  // TODO prime refactor candidate as we get deeper into validation:
  // Meta
  patterns,
  validate: {
    regex,
    size
  },
}
