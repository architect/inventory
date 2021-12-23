module.exports = {
  // Register of all official, blessed Architect pragmas
  all: [
    'app',
    'aws',
    'cdn',
    'events',
    'http',
    'macros',
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
}
