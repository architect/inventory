module.exports = function validatePreferences (preferences) {
  // Env checks
  let { env } = preferences
  if (env && typeof env !== 'object') envErr(env)

  let envs = [ 'testing', 'staging', 'production' ]
  envs.forEach(e => {
    if (env[e] && typeof env[e] !== 'object') envErr(e)
    if (env[e] && Array.isArray(env[e])) envErr(e)
  })
}

function envErr (e) {
  throw ReferenceError(`Invalid preferences setting: @env ${e}`)
}
