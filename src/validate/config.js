let is = require('../lib/is')
let { lambdas } = require('../lib/pragmas')
let { aliases, runtimeList } = require('lambda-runtimes')
let allRuntimes = runtimeList.concat([ 'deno' ])

/**
 * Configuration validator
 */
module.exports = function configValidator (params, inventory, errors) {
  let { runtime: globalRuntime, memory: globalMemory, timeout: globalTimeout } = inventory.aws

  /**
   * Global config
   */
  // Memory
  if (is.defined(globalMemory) && invalidMemory(globalMemory)) {
    errors.push(invalidMemoryMsg(`${globalMemory} MB (@aws)`))
  }
  // Runtime
  if ((globalRuntime && !is.string(globalRuntime)) ||
      (globalRuntime && !allRuntimes.includes(globalRuntime) &&
       !aliases[globalRuntime] && !aliases[globalRuntime.toLowerCase()])) {
    errors.push(`Invalid project-level runtime: ${globalRuntime}`)
  }
  // Timeout
  if (is.defined(globalTimeout) && invalidTimeout(globalTimeout)) {
    errors.push(invalidTimeoutMsg(`${globalTimeout} seconds (@aws)`))
  }

  /**
   * Lambda config
   */
  lambdas.forEach(p => {
    let pragma = inventory[p]
    if (pragma) pragma.forEach(({ name, config }) => {
      let { memory, runtime, timeout } = config

      // Memory
      if (invalidMemory(memory) && memory !== globalMemory) {
        errors.push(invalidMemoryMsg(`${memory} MB (@${p} ${name})`))
      }
      // Runtime
      if (!allRuntimes.includes(runtime) && runtime !== globalRuntime) {
        errors.push(`Invalid runtime: ${runtime} (@${p} ${name})`)
      }
      // Timeout
      if (invalidTimeout(timeout) && timeout !== globalTimeout) {
        errors.push(invalidTimeoutMsg(`${timeout} seconds (@${p} ${name})`))
      }
    })
  })
}

// Memory
let minMemory = 128
let maxMemory = 10240
let invalidMemory = memory => !is.number(memory) || (memory < minMemory) || (memory > maxMemory)
let invalidMemoryMsg = info => `Invalid Lambda memory setting: ${info}, memory must be between ${minMemory} - ${maxMemory} MB`

// Timeout
let minTimeout = 1
let maxTimeout = 1 * 60 * 15 // 15 mins
let invalidTimeout = timeout => !is.number(timeout) || (timeout < minTimeout) || (timeout > maxTimeout)
let invalidTimeoutMsg = info => `Invalid Lambda timeout setting: ${info}, timeout must be between ${minTimeout} - ${maxTimeout} seconds`
