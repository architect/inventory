let fnConfig = require('./function-config')

/**
 * Returns a default stub inventory object
 * - Every possible officially supported value should be present
 */
module.exports = function inventoryDefaults () {
  let defaultFunctionConfig = fnConfig()
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
      region: 'us-west-2',
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
