let { all: allPragmas } = require('../../lib/pragmas')

// Get all pragmas except special cases
let isSpecial = p => p === 'shared' || p === 'views'
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
    pragmas[name] = visitor({ arc, inventory, errors })
  })

  // Lambda source directory list
  let dirs = srcDirs({ arc, inventory, pragmas })
  pragmas.lambdaSrcDirs = dirs.lambdaSrcDirs
  pragmas.lambdasBySrcDir = dirs.lambdasBySrcDir

  // @shared (which needs all Lambdae pragmas + srcDirs to validate)
  pragmas.shared = shared({ arc, pragmas, inventory, errors })

  // @views (which needs @http to validate)
  pragmas.views = views({ arc, pragmas, inventory, errors })

  return pragmas
}
