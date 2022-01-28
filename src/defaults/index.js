let { join } = require('path')
let fnConfig = require('./function-config')
let { pragmas } = require('../lib')

/**
 * Returns a default stub inventory object
 * - Every possible officially supported value should be present
 */
module.exports = function inventoryDefaults (params = {}) {
  let { cwd = process.cwd(), deployStage = null, region } = params
  // Allow region env var override
  region = region || process.env.AWS_REGION || 'us-west-2'
  let defaultFunctionConfig = fnConfig()
  return {
    // Meta
    _arc: {
      version: 'Unknown',     // @architect/architect semver (if installed)
      defaultFunctionConfig,  // Architect's default function config
      pragmas,                // Registry of all, Lambda, reserved, retired pragmas
      deployStage,            // Deploy stage of the running project (if specified)
    },
    _project: {
      type: 'aws',
      cwd,                          // Project root dir
      src: join(cwd, 'src'),        // Default source tree dir
      build: null,                  // Optional build artifact dir
      manifest: null,               // Root project manifest filename
      preferences: null,            // Realized preferences obj, resolved from local > global
      localPreferences: null,       // Local preferences obj
      localPreferencesFile: null,   // Local preferences file path
      globalPreferences: null,      // Global preferences obj
      globalPreferencesFile: null,  // Global preferences file path
      defaultFunctionConfig,        // Project-level function config
      rootHandler: null,            // null | configured | arcStaticAssetProxy | proxy
      env: {                        // Env vars pulled from:
        local: null,                // - Local/global prefs or .env
        plugins: null,              // - Plugins
        aws: null,                  // - SSM
      },
      customRuntimes: null,         // Runtime plugins
      arc: [],                      // Raw arc obj
      raw: '',                      // Raw arc string
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
    customLambdas: null,
    // Collection of all Lambda source paths
    lambdaSrcDirs: null,
    // Lambda lookup by source directory
    lambdasBySrcDir: null,
  }
}
