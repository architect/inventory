let { all: allPragmas } = require('../../lib/pragmas')

// Get all pragmas except special cases
let isSpecial = p => [ 'shared', 'views' ].includes(p)
let visitors = allPragmas.map(p => {
  // eslint-disable-next-line
  if (!isSpecial(p)) return require(`./${p}`)
}).filter(Boolean)

// Special order-dependent visitors that run in a second pass
let srcDirs = require('./src-dirs')
let shared = require('./shared')
let views = require('./views')

module.exports = function configureArcPragmas ({ arc, inventory }, errors) {
  if (inventory._project.type !== 'aws') {
    throw ReferenceError('Inventory can only configure pragmas for AWS projects')
  }

  let pragmas = {}
  visitors.forEach(visitor => {
    // Expects pragma visitors to have function name of: `configure${pragma}`
    let name = visitor.name.replace('configure', '').toLowerCase()
    // Special cases for dasherization
    if (name === 'tablesindexes') name = 'tables-indexes'
    if (name === 'tablesstreams') name = 'tables-streams'
    pragmas[name] = visitor({ arc, inventory, errors })
  })

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
