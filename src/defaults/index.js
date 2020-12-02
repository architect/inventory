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
      version: 'Unknown',     // @architect/architect semver (if installed)
      defaultFunctionConfig,  // Architect's default function config
    },
    _project: {
      type: 'aws',
      src: cwd,
      manifest: null,         // Root project manifest filename
      // manifestCreated      // TODO
      preferences: null,      // Local preferences obj
      preferencesFile: null,  // Local preferences file path
      defaultFunctionConfig,  // Project-level function config
      rootHandler: null,      // null | configured | arcStaticAssetProxy | proxy
      arc: [],                // Raw arc obj
      raw: '',                // Raw arc string
      env: null,              // Env vars pulled from SSM (if enabled)
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
      region,                 // AWS always requires a region, so we provide a default
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
    shared: null,
    static: null,
    streams: null,
    tables: null,
    views: null,
    ws: null,
    // Collection of all Function paths
    lambdaSrcDirs: null,
  }
}
