let envs = [ 'testing', 'staging', 'production' ]

module.exports = function mergeEnvVars (params) {
  let { name, source, target, errors } = params
  if (source === null) return target
  if (target === null) return source
  let probs = []

  // Deep copy to reset any potential refs
  let merged = JSON.parse(JSON.stringify(target))
  envs.forEach(env => {
    if (!source[env]) return
    Object.keys(source[env]).forEach(k => {
      if (merged[env]?.[k]) {
        probs.push(`'${env}' variable '${k}'`)
      }
      else {
        if (!merged[env]) merged[env] = {}
        merged[env][k] = source[env][k]
      }
    })
  })

  if (probs.length) {
    let s = probs.length > 1 ? 's' : ''
    let msg = `${name} env var${s} conflicts with plugin:\n` +
              `- ${probs.join('\n- ')}`
    errors.push(msg)
  }

  return merged
}
