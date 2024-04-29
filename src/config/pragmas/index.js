let { pragmas } = require('../../lib')
let { all: allPragmas } = pragmas

// Get all pragmas except special cases
let isSpecial = p => [ 'plugins', 'shared', 'views' ].includes(p)
let visitors = allPragmas.map(p => {
  if (!isSpecial(p)) return require(`./${p}`)
}).filter(Boolean)

// Special order-dependent visitors
let customLambdas = require('./meta/custom-lambdas')
let srcDirs = require('./meta/src-dirs')
let shared = require('./shared')
let views = require('./views')

function configureArcPragmas ({ arc, inventory, errors }) {
  if (inventory._project.type !== 'aws') {
    throw ReferenceError('Inventory can only configure pragmas for AWS projects')
  }

  let pragmas = {}

  // All the main pragma visitors
  visitors.forEach(visitor => {
    // Expects pragma visitors to have function name of: `configure${pragma}`
    let name = visitor.name.replace('configure', '').toLowerCase()
    // Special cases for dasherization
    if (name === 'tablesindexes') name = 'tables-indexes'
    if (name === 'tablesstreams') name = 'tables-streams'
    pragmas[name] = visitor({ arc, inventory, errors })
  })

  // Custom Lambdas from @plugins
  pragmas.customLambdas = customLambdas({ arc, inventory, errors })

  // Lambda source directory list
  let dirs = srcDirs({ pragmas, errors })
  pragmas.lambdaSrcDirs = dirs.lambdaSrcDirs
  pragmas.lambdasBySrcDir = dirs.lambdasBySrcDir

  // @shared (which needs all Lambdae pragmas + srcDirs to validate)
  pragmas.shared = shared({ arc, pragmas, inventory, errors })

  // @views (which needs @http to validate)
  pragmas.views = views({ arc, pragmas, inventory, errors })

  return pragmas
}

// Plugins get run early so visitors can rely on the plugin method tree
configureArcPragmas.plugins = require('./plugins')
module.exports = configureArcPragmas
