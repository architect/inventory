let fnConfig = require('./function-config')

/**
 * Returns a default stub inventory object
 * - Every possible officially supported value should be present
 */
module.exports = function inventoryDefaults () {
  let defaultFunctionConfig = fnConfig()
  // Allow region env var override
  let region = process.env.AWS_REGION || 'us-west-2'
  return {
    // Meta
    arc: {
      version: 'Unknown',
      defaultFunctionConfig,
    },
    project: {
      type: 'aws',
      dir: '',
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
    events: null,
    http: null,
    indexes: null,
    macros: null,
    queues: null,
    scheduled: null,
    static: null,
    streams: null,
    tables: null,
    ws: null,
    // Collection of all Function paths
    lambdaSrcDirs: null,
    localPaths: null, // TODO deprecate me (copy of lambdaSrcDirs for backwards compat)
  }
}
