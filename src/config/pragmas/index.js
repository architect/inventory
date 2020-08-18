let app = require('./app')
let aws = require('./aws')
let events = require('./events')
let http = require('./http')
let indexes = require('./indexes')
let macros = require('./macros')
let queues = require('./queues')
let scheduled = require('./scheduled')
let static = require('./static')
let streams = require('./streams')
let tables = require('./tables')
let ws = require('./ws')
let srcDirs = require('./src-dirs')

module.exports = function configureArcPragmas ({ arc, inventory }) {
  if (inventory.project.type !== 'aws') {
    throw ReferenceError('Inventory can only configure pragmas for AWS projects')
  }

  // @app
  inventory.app = app({ arc, inventory })

  // @aws
  inventory.aws = aws({ arc, inventory })

  // @events
  inventory.events = events({ arc, inventory })

  // @http
  inventory.http = http({ arc, inventory })

  // @indexes
  inventory.indexes = indexes({ arc, inventory })

  // @macros
  inventory.macros = macros({ arc, inventory })

  // @queues
  inventory.queues = queues({ arc, inventory })

  // @scheduled
  inventory.scheduled = scheduled({ arc, inventory })

  // @static
  inventory.static = static({ arc, inventory })

  // @streams
  inventory.streams = streams({ arc, inventory })

  // @tables
  inventory.tables = tables({ arc, inventory })

  // @ws
  inventory.ws = ws({ arc, inventory })

  // Lambda source directory list
  inventory.lambdaSrcDirs = srcDirs({ arc, inventory })
  inventory.localPaths = inventory.lambdaSrcDirs

  return inventory
}
