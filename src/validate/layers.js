let { sep } = require('path')
let validateARN = require('./arn')
let errorFmt = require('../lib/error-fmt')

/**
 * Layer validator
 * @param {array} layers - Layers to check
 * @param {string} region - Current configured AWS region
 * @param {string} location - Item containing potentially offending layer config
 */
module.exports = function validate (params, callback) {
  let { layers, region, location } = params
  if (!layers || !layers.length) callback()
  else {
    let errors = []
    if (layers.length > 5) {
      let layerList = '\n  - ' + layers.join('\n  - ')
      errors.push(`Lambda can only be configured with up to 5 layers; got:${layerList}`)
    }
    // CloudFormation fails without a helpful error if any layers aren't in the same region as the app because CloudFormation
    for (let arn of layers) {
      let arnError = validateARN({ arn, region })
      if (arnError) errors.push(arnError)
    }

    if (errors.length) {
      // Location may be missing if running statelessly
      location = location && location.startsWith(sep) ? location.substr(1) : location
      let loc = location ? ' in ' + location : ''
      let msg = errorFmt('Layer validation', errors, loc)
      callback(Error(msg))
    }
    else callback()
  }
}
