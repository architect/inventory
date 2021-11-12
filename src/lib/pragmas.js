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
    'tables',
    'tables-streams',
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
    'tables-streams',
    'ws',
  ],
}
