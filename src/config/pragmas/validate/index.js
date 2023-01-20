/* eslint-disable global-require */
module.exports = {
  // Pragmas and project validation
  aws:            require('./_aws'),
  events:         require('./_events'),
  http:           require('./_http'),
  proxy:          require('./_proxy'),
  queues:         require('./_events'), // Same ruleset as @events
  scheduled:      require('./_scheduled'),
  shared:         require('./_shared'), // Also includes @views
  tables:         require('./_tables'),
  tablesIndexes:  require('./_tables'), // Same ruleset as @tables (more or less)
  tablesStreams:  require('./_tables-streams'),
  websockets:     require('./_websockets'),

  // Misc
  validate:       require('./_lib')
}
