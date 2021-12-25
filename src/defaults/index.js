let fnConfig = require('./function-config')
let pragmas = require('../lib/pragmas')

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
      pragmas,                // Registry of all + Lambda pragmas
    },
    _project: {
      type: 'aws',
      src: cwd,
      manifest: null,               // Root project manifest filename
      // manifestCreated            // TODO
      preferences: null,            // Realized preferences obj, resolved from global > local
      localPreferences: null,       // Local preferences obj
      localPreferencesFile: null,   // Local preferences file path
      globalPreferences: null,      // Global preferences obj
      globalPreferencesFile: null,  // Global preferences file path
      defaultFunctionConfig,        // Project-level function config
      rootHandler: null,            // null | configured | arcStaticAssetProxy | proxy
      arc: [],                      // Raw arc obj
      raw: '',                      // Raw arc string
      env: null,                    // Env vars pulled from SSM (if enabled)
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
      region, // AWS always requires a region, so we provide a default
      runtime: null,
      timeout: null,
    },
    // App pragmas
    cdn: null,
    events: null,
    http: null,
    plugins: null,
    proxy: null,
    queues: null,
    scheduled: null,
    shared: null,
    static: null,
    tables: null,
    'tables-indexes': null,
    'tables-streams': null,
    views: null,
    ws: null,
    // Unclassified / non-pragma custom Lambdas created by plugins
    'custom-lambdas': null,
    // Collection of all Lambda paths
    lambdaSrcDirs: null,
    // Lambda lookup by source directory
    lambdasBySrcDir: null,
  }
}
