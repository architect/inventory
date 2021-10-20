let { lambdas } = require('../lib/pragmas')
let { aliases, runtimeList } = require('lambda-runtimes')

/**
 * Runtime validator
 */
module.exports = function runtimeValidator (params, inventory, errors) {

  let allRuntimes = runtimeList.concat([ 'deno' ])
  let globalRuntime = inventory.aws?.runtime
  if (globalRuntime &&
      !allRuntimes.includes(globalRuntime) &&
      !aliases[globalRuntime]) {
    errors.push(`Invalid project-level runtime: ${globalRuntime}`)
  }

  // Walk the tree of layer configs, starting with @aws
  lambdas.forEach(p => {
    let pragma = inventory[p]
    if (pragma) pragma.forEach(entry => {
      let runtime = entry.config.runtime
      if (runtime === globalRuntime) return
      if (!allRuntimes.includes(runtime)) {
        errors.push(`Invalid runtime: ${runtime} (@${p} ${entry.name})`)
      }
    })
  })
}
