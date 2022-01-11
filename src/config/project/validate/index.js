let { is } = require('./../../../lib')

module.exports = function validatePreferences (preferences, errors) {
  // Env checks
  let { env } = preferences
  if (!env) return
  if (env && !is.object(env)) errors.push(`Invalid preferences setting: @env ${env}`)

  let envs = [ 'testing', 'staging', 'production' ]
  envs.forEach(e => {
    if (env[e] && !is.object(env[e])) errors.push(`Invalid preferences setting: @env ${e}`)
  })
}
