// Validates Lambda layer / policy ARNs, prob can't be used for other kinds of ARN
module.exports = function validateARN ({ arn, region }) {
  let invalid = `Invalid ARN: ${arn}`
  if (typeof arn !== 'string' ||
      !arn.startsWith('arn:') ||
      arn.split(':').length !== 8) {
    return invalid
  }
  if (!region) throw ReferenceError('Region not found')
  let parts = arn.split(':')
  let layerRegion = parts[3]
  if (region !== layerRegion) {
    let err = `Lambda layers must be in the same region as app\n` +
              `  - App region: ${region}\n` +
              `  - Layer ARN: ${arn}\n` +
              `  - Layer region: ${layerRegion}`
    return err
  }
}
