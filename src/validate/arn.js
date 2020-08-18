// Validates Lambda layer / policy ARNs, prob can't be used for other kinds of ARN
module.exports = function validateARN (arn) {
  let parts = arn.split(':')
  if (!arn.startsWith('arn:') || parts.length !== 8) {
    return `- Invalid ARN: ${arn}`
  }
}
