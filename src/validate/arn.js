let is = require('../lib/is')

// Validates Lambda layer / policy ARNs, prob can't be used for other kinds of ARN
module.exports = function validateARN ({ arn, region, loc }) {
  if (!is.string(arn) ||
      !arn.startsWith('arn:') ||
      arn.split(':').length !== 8) {
    /* istanbul ignore next */
    let lambda = loc ? `in ${loc}` : ''
    return `Invalid ARN${lambda}: ${arn}`
  }

  let parts = arn.split(':')
  let layerRegion = parts[3]
  if (region !== layerRegion) {
    /* istanbul ignore next */
    let lambda = loc ? `  - Lambda: ${loc}\n` : ''
    let err = `Lambda layers must be in the same region as app\n` + lambda +
              `  - App region: ${region}\n` +
              `  - Layer ARN: ${arn}\n` +
              `  - Layer region: ${layerRegion}`
    return err
  }
}
