let is = require('../../../lib/is')
let { aliases, runtimes, runtimeList } = require('lambda-runtimes')

// Runtime interpolater
module.exports = function getRuntime (config) {
  let { runtime } = config

  if (runtimeList.includes(runtime) || runtime === 'deno') {
    return config
  }

  if (typeof runtime === 'string') {
    runtime = runtime.toLowerCase()

    // Runtime is not actually an AWS value, but a shorthand/aliased name
    if (aliases[runtime]) {
      let aliased = aliases[runtime]
      config.runtime = runtimes[aliased][0]
      config.runtimeAlias = runtime
    }
  }
  else if (is.defined(runtime)) {
    // Someone did something funky like specify a number or bool, so coerce and let it fail validation
    config.runtime = `${config.runtime}`
  }
  return config
}
