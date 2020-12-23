/* eslint-disable global-require */
let visitors = [
  require('./app'),       // @app
  require('./aws'),       // @aws
  require('./cdn'),       // @cdn
  require('./events'),    // @events
  require('./http'),      // @http
  require('./indexes'),   // @indexes
  require('./proxy'),     // @macros
  require('./macros'),    // @proxy
  require('./queues'),    // @queues
  require('./scheduled'), // @scheduled
  require('./static'),    // @static
  require('./streams'),   // @streams
  require('./tables'),    // @tables
  require('./ws'),        // @ws
]
// Special order-dependent visitors that run in a second pass
let srcDirs = require('./src-dirs')
let shared = require('./shared')
let views = require('./views')

module.exports = function configureArcPragmas ({ arc, inventory }) {
  if (inventory._project.type !== 'aws') {
    throw ReferenceError('Inventory can only configure pragmas for AWS projects')
  }

  let pragmas = {}
  visitors.forEach(visitor => {
    // Expects pragma visitors to have function name of: `configure${pragma}`
    let name = visitor.name.replace('configure', '').toLowerCase()
    pragmas[name] = visitor({ arc, inventory })
  })

  // Lambda source directory list
  let dirs = srcDirs({ arc, pragmas })
  pragmas.lambdaSrcDirs = dirs.lambdaSrcDirs
  pragmas.lambdasBySrcDir = dirs.lambdasBySrcDir

  // @shared (which needs all Lambdae pragmas + srcDirs to validate)
  pragmas.shared = shared({ arc, pragmas, inventory })

  // @views (which needs @http to validate)
  pragmas.views = views({ arc, pragmas, inventory })

  return pragmas
}
