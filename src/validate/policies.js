let validateARN = require('./arn')

module.exports = function validatePolicies (policies) {
  if (!policies || !policies.length) return

  // TODO deeper policy validation
  for (let policy of policies) {
    validateARN(policy)
  }
}
