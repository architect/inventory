// Validates Lambda layer / policy ARNs, prob can't be used for other kinds of ARN
module.exports = function validateARN ({ arn, region }) {
  let invalid = `- Invalid ARN: ${arn}`
  try {
    if (typeof arn !== 'string' || !arn.startsWith('arn:') || arn.split(':').length !== 8) {
      return invalid
    }
    if (region) {
      let parts = arn.split(':')
      let layerRegion = parts[3]
      if (region && region !== layerRegion) {
        let err = `- Lambda layers must be in the same region as app\n` +
                  `  - App region: ${region}\n` +
                  `  - Layer ARN: ${arn}\n` +
                  `  - Layer region: ${layerRegion ? layerRegion : 'unknown'}`
        return err
      }
    }

  }
  // Catch weird issues, like it's just a number or bool
  catch (err) {
    return invalid
  }
}
