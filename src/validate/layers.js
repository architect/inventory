let validateARN = require('./arn')
let { sep } = require('path')

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
    let err = []
    if (layers.length > 5) {
      let layerList = '\n  - ' + layers.join('\n  - ')
      err.push(`- Lambda can only be configured with up to 5 layers; got:${layerList}`)
    }
    // CloudFormation fails without a helpful error if any layers aren't in the same region as the app because CloudFormation
    for (let arn of layers) {
      let arnError = validateARN({ arn, region })
      if (arnError) err.push(arnError)
    }

    if (err.length) {
      location = location.startsWith(sep) ? location.substr(1) : location
      let msg = `Layer validation error${err.length > 1 ? 's' : ''} in ${location}:\n${err.join('\n')}`
      callback(Error(msg))
    }
    else callback()
  }
}
