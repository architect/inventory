let fnConfig = require('./function-config')

/**
 * Returns a default stub inventory object
 * - Every possible officially supported value should be present
 */
module.exports = function inventoryDefaults (params = {}) {
  let { cwd, region } = params
  // Allow region env var override
  region = process.env.AWS_REGION || region || 'us-west-2'
  let defaultFunctionConfig = fnConfig()
  return {
    // Meta
    _arc: {
      version: 'Unknown',
      defaultFunctionConfig,
    },
    _project: {
      type: 'aws',
      src: cwd,
      manifest: null,
      // manifestCreated: null, // TODO
      defaultFunctionConfig,
      arc: [],
      raw: '',
      env: null,
    },
    // App + vendor config
    app: '',
    aws: {
      apigateway: null,
      bucket: null,
      concurrency: null,
      layers: null,
      memory: null,
      policies: null,
      profile: null,
      region,
      runtime: null,
      timeout: null,
    },
    // App pragmas
    cdn: null,
    events: null,
    http: null,
    indexes: null,
    macros: null,
    proxy: null,
    queues: null,
    scheduled: null,
    static: null,
    streams: null,
    tables: null,
    views: null,
    ws: null,
    // Collection of all Function paths
    lambdaSrcDirs: null,
    localPaths: null, // TODO deprecate me (copy of lambdaSrcDirs for backwards compat)
  }
}
