// Lambda runtimes module does not include `deno` (which is Arc-specific)
// Runtime validator will pass that through
let { runtimes } = require('lambda-runtimes')

// Runtime interpolater
module.exports = function getRuntime (name) {
  if (typeof name === 'string') {
    name = name.toLowerCase()
    if (runtimes[name]) return runtimes[name][0]
    return name // Validated later
  }
}
