let { getRuntime } = require('@architect/utils')

/**
 * Return the default config for all Architect projects' functions across all the land ✨
 */
module.exports = function createDefaultFunctionConfig () {
  return {
    timeout: 5,
    memory: 1152,
    runtime: getRuntime(),
    handler: 'index.handler',
    state: 'n/a',
    concurrency: 'unthrottled',
    layers: [],
    policies: [],
    shared: true,
    env: true,
  }
}
