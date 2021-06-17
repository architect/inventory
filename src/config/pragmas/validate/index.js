/* eslint-disable global-require */
module.exports = {
  // Pragmas and project validation
  aws:        require('./_aws'),
  events:     require('./_events'),
  http:       require('./_http'),
  indexes:    require('./_tables'), // Same ruleset as @tables (more or less)
  proxy:      require('./_proxy'),
  tables:     require('./_tables'),
  queues:     require('./_events'), // Same ruleset as @events
  scheduled:  require('./_scheduled'),
  shared:     require('./_shared'), // Also includes @views
  streams:    require('./_streams'),
  websockets: require('./_websockets'),

  // Misc
  validate: require('./_lib')
}
