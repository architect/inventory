module.exports = {
  // Register of all official, blessed Architect pragmas
  all: [
    'app',
    'aws',
    'cdn',
    'events',
    'http',
    'indexes',
    'macros',
    'plugins',
    'proxy',
    'queues',
    'scheduled',
    'shared',
    'static',
    'streams',
    'tables',
    'views',
    'ws',
  ],
  // Pragmas that (if present) are expected to contain Lambdae
  lambdas: [
    'events',
    'http',
    'plugins',
    'queues',
    'scheduled',
    'streams',
    'ws',
  ],
}
