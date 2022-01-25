let { is } = require('./../../../lib')

module.exports = function validatePreferences (preferences, errors) {
  // Env checks
  let { env, sandbox } = preferences
  let envs = [ 'testing', 'staging', 'production' ]

  if (env && !is.object(env)) {
    errors.push(`Invalid preferences setting: @env ${env}`)
  }
  else if (env) {
    envs.forEach(e => {
      if (env[e] && !is.object(env[e])) errors.push(`Invalid preferences setting: @env ${e}`)
    })
  }

  if (sandbox?.env && !envs.includes(sandbox.env)) {
    errors.push(`Invalid preferences setting: @sandbox env ${sandbox.env}`)
  }
}
