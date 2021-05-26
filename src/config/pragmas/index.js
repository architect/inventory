/* eslint-disable global-require */
let visitors = [
  require('./app'),       // @app
  require('./aws'),       // @aws
  require('./cdn'),       // @cdn
  require('./events'),    // @events
  require('./http'),      // @http
  require('./indexes'),   // @indexes
  require('./macros'),    // @macros
  require('./proxy'),     // @proxy
  require('./plugins'),   // @plugins - but only if they contain lambdas
  require('./queues'),    // @queues
  require('./scheduled'), // @scheduled
  require('./static'),    // @static
  require('./streams'),   // @streams
  require('./tables'),    // @tables
  require('./ws'),        // @ws
]
let { basename } = require('path')
// Special order-dependent visitors that run in a second pass
let srcDirs = require('./src-dirs')
let shared = require('./shared')
let views = require('./views')

module.exports = function configureArcPragmas ({ arc, inventory }) {
  if (inventory._project.type !== 'aws') {
    throw ReferenceError('Inventory can only configure pragmas for AWS projects')
  }

  let pragmas = {}
  let errors = []
  visitors.forEach(visitor => {
    // Expects pragma visitors to have function name of: `configure${pragma}`
    let name = visitor.name.replace('configure', '').toLowerCase()
    pragmas[name] = visitor({ arc, inventory, errors })
  })
  if (errors.length) {
    let arcFile = inventory._project.manifest
      ? ` in ${basename(inventory._project.manifest)}`
      : ''
    let output = errors.map(err => `- ${err}`).join('\n')
    let err = Error(`Validation error${errors.length > 1 ? 's' : ''}${arcFile}\n${output}`)
    throw err
  }

  // Lambda source directory list
  let dirs = srcDirs({ arc, inventory, pragmas })
  pragmas.lambdaSrcDirs = dirs.lambdaSrcDirs
  pragmas.lambdasBySrcDir = dirs.lambdasBySrcDir

  // @shared (which needs all Lambdae pragmas + srcDirs to validate)
  pragmas.shared = shared({ arc, pragmas, inventory })

  // @views (which needs @http to validate)
  pragmas.views = views({ arc, pragmas, inventory })

  return pragmas
}
