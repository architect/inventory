let { lambdas } = require('../lib/pragmas')
let { runtimes } = require('../lib/runtimes')

/**
 * Runtime validator
 */
module.exports = function runtimeValidator (params, inventory, errors) {

  let allRuntimes = Object.keys(runtimes).reduce((a, k) => a.concat(runtimes[k]), [])
  let globalRuntime = inventory.aws?.runtime
  if (globalRuntime && !allRuntimes.includes(globalRuntime)) {
    errors.push(`Invalid project-level runtime: ${globalRuntime}`)
  }

  // Walk the tree of layer configs, starting with @aws
  Object.keys(inventory).forEach(i => {
    let item = inventory[i]
    if (lambdas.includes(i) && item) {
      item.forEach(entry => {
        let runtime = entry.config.runtime
        if (runtime === globalRuntime) return
        if (!allRuntimes.includes(runtime)) {
          errors.push(`Invalid runtime: ${runtime} (@${i} ${entry.name})`)
        }
      })
    }
  })
}
