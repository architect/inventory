let { sep } = require('path')
let { is, pragmas } = require('../lib')
let { lambdas } = pragmas
let plural = arr => arr.length > 1 ? 's' : ''

/**
 * Layer validator
 */
module.exports = function layerValidator (params, inventory, errors) {
  let { _project } = inventory
  let { region, layers: globalLayers } = inventory.aws
  let { cwd, validateLayers = true } = params

  // Shouldn't be possible because we backfill region, but jic
  if (!region) throw ReferenceError('Region not found')

  // Allow for manual opt-out of layer validation
  if (!validateLayers) return

  /**
   * Global config
   */
  let location = _project?.manifest?.replace(cwd, '')
  validateLayer({ layers: globalLayers, region, location, errors })

  /**
   * Lambda config
   */
  lambdas.forEach(p => {
    let pragma = inventory[p]
    if (pragma) pragma.forEach(({ config, configFile }) => {
      let location = configFile?.replace(cwd, '')
      validateLayer({ layers: config.layers, region, location, errors })
    })
  })
}

function validateLayer ({ layers, region, location, errors }) {
  let loc = location && location.startsWith(sep) ? location.substr(1) : location
  let config = loc ? ` (${loc})` : ''
  if (!layers || !layers.length) return
  else {
    if (layers.length > 5) {
      let list = `${layers.map(l => `  - ${l}`).join('\n')}`
      errors.push(`Lambdas can only be configured with up to 5 layers, got ${layers.length} layers${config}:\n${list}`)
    }
    // CloudFormation fails without a helpful error if any layers aren't in the same region as the app because CloudFormation
    let arnErrors = validateARN({ layers, region, config })
    if (arnErrors) errors.push(arnErrors)
  }
}

// Validates Lambda layer / policy ARNs, prob can't be used for other kinds of ARN
function validateARN ({ layers, region, config }) {
  let invalidArns = []
  let badRegions = []
  layers.forEach(arn => {
    let parts = is.string(arn) && arn.split(':')
    // Invalid
    if (!is.string(arn) ||
        !arn.startsWith('arn:') ||
        parts.length !== 8) {
      return invalidArns.push(`  - ${arn}`)
    }
    // Bad region
    let layerRegion = parts[3]
    if (region !== layerRegion) {
      badRegions.push(
        `  - Layer ARN: ${arn}\n` +
        `  - Layer region: ${layerRegion}`,
      )
    }
  })
  let err = ''
  if (invalidArns.length) {
    err +=  `Invalid ARN${plural(invalidArns)}${config}:\n` +
            invalidArns.join('\n')
  }
  if (badRegions.length) {
    err +=  `Layer${plural(badRegions)} ` +
            `not in app's region of ${region}${config}:\n` +
            badRegions.join('\n')
  }
  if (err) return err
}
