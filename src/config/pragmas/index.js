let app = require('./app')
let aws = require('./aws')
let cdn = require('./cdn')
let events = require('./events')
let http = require('./http')
let indexes = require('./indexes')
let proxy = require('./proxy')
let macros = require('./macros')
let queues = require('./queues')
let scheduled = require('./scheduled')
let static = require('./static')
let streams = require('./streams')
let tables = require('./tables')
let views = require('./views')
let ws = require('./ws')
let srcDirs = require('./src-dirs')

module.exports = function configureArcPragmas ({ arc, inventory }) {
  if (inventory.project.type !== 'aws') {
    throw ReferenceError('Inventory can only configure pragmas for AWS projects')
  }

  let pragmas = {
    // @app
    app: app({ arc, inventory }),

    // @aws
    aws: aws({ arc, inventory }),

    // @cdn
    cdn: cdn({ arc, inventory }),

    // @events
    events: events({ arc, inventory }),

    // @http
    http: http({ arc, inventory }),

    // @indexes
    indexes: indexes({ arc, inventory }),

    // @macros
    macros: macros({ arc, inventory }),

    // @proxy
    proxy: proxy({ arc, inventory }),

    // @queues
    queues: queues({ arc, inventory }),

    // @scheduled
    scheduled: scheduled({ arc, inventory }),

    // @static
    static: static({ arc, inventory }),

    // @streams
    streams: streams({ arc, inventory }),

    // @tables
    tables: tables({ arc, inventory }),

    // @ws
    ws: ws({ arc, inventory }),
  }

  // @views (which needs @http to validate)
  pragmas.views = views({ arc, pragmas })

  // Lambda source directory list
  pragmas.lambdaSrcDirs = srcDirs({ arc, pragmas })
  pragmas.localPaths = pragmas.lambdaSrcDirs

  return pragmas
}
