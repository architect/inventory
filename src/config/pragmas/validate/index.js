/* eslint-disable global-require */

module.exports = {
  // Pragmas and project validation
  aws:      require('./_aws'),
  http:     require('./_http'),
  shared:   require('./_shared'), // Also includes @views

  // Misc
  validate: require('./_lib')
}
