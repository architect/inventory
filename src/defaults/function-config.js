/**
 * Return the default config for all Architect projects' functions across all the land ✨
 */
module.exports = function createDefaultFunctionConfig () {
  return {
    timeout: 5,
    memory: 1152,
    runtime: 'nodejs20.x',
    architecture: 'arm64',
    handler: 'index.handler',
    state: 'n/a',
    concurrency: 'unthrottled',
    storage: 512,
    layers: [],
    policies: [],
    shared: true,
    env: true,
  }
}
