let { sep } = require('path')
let { lambdas } = require('../lib/pragmas')
let validateARN = require('./arn')

/**
 * Layer validator
 */
module.exports = function layerValidator (params, inventory, errors) {
  let { region } = inventory.aws
  let { cwd, validateLayers = true } = params

  // Shouldn't be possible because we backfill region, but jic
  if (!region) throw ReferenceError('Region not found')

  // Allow for manual opt-out of layer validation
  if (!validateLayers) return

  // Walk the tree of layer configs, starting with @aws
  Object.entries(inventory).forEach(([ i ]) => {
    let item = inventory[i]
    if (i === 'aws') {
      let location = inventory._project.manifest &&
                     inventory._project.manifest.replace(cwd, '')
      let layers = item.layers
      validateLayer({ layers, region, location })
    }
    else if (lambdas.some(p => p === i) && item) {
      item.forEach(entry => {
        // Probably unnecessary if no configFile is present but why not, let's be extra safe
        let location = entry.configFile && entry.configFile.replace(cwd, '')
        let layers = entry.config.layers
        validateLayer({ layers, region, location })
      })
    }
  })

  function validateLayer ({ layers, region, location }) {
    let loc = location && location.startsWith(sep) ? location.substr(1) : location
    let lambda = loc ? `  - Lambda: ${loc}\n` : ''
    if (!layers || !layers.length) return
    else {
      if (layers.length > 5) {
        let list = `  - Layers:\n ${layers.map(l => `    - ${l}`).join('\n')}`
        errors.push(`Lambda can only be configured with up to 5 layers\n${lambda}${list}`)
      }
      // CloudFormation fails without a helpful error if any layers aren't in the same region as the app because CloudFormation
      for (let arn of layers) {
        let arnError = validateARN({ arn, region, loc })
        if (arnError) errors.push(arnError)
      }
    }
  }
}
