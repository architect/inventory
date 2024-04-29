module.exports = {
  // Register of all official, blessed Architect pragmas
  all: [
    'app',
    'aws',
    'cdn',
    'events',
    'http',
    'plugins',
    'proxy',
    'queues',
    'scheduled',
    'shared',
    'static',
    'tables',
    'tables-indexes',
    'tables-streams',
    'views',
    'ws',
  ],
  // Pragmas that (if present) are expected to contain Lambdae
  lambdas: [
    'events',
    'http',
    'queues',
    'scheduled',
    'tables-streams',
    'ws',
  ],
  // Reserved pragma names that map to internal Inventory properties
  reserved: [
    'customLambdas',
  ],
  // Retired pragmas no longer in active use
  retired: [
    'indexes',
    'macros',
    'slack',
    'streams', // Never fully launched
    // Static types
    'css',
    'html',
    'js',
    'json',
    'jsonapi',
    'text',
    'xml',
  ],
}
