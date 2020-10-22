let reader = require('./reader')

// The Architect project manifest
let projectManifest = {
  arc: [ 'app.arc', '.arc' ],
  json: [ 'arc.json' ],
  yaml: [ 'arc.yaml', 'arc.yml' ],
  toml: [ 'arc.toml' ],
  _default: `@app\napp-default\n@http\n@static`,
}

// Individual Lambda function configurations
let functionConfig = {
  arc: [ 'config.arc', '.arc-config' ],
  json: [ 'arc.json', 'arc-config.json' ],
  yaml: [ 'config.yaml', 'config.yml', 'arc-config.yaml', 'arc-config.yml' ],
  toml: [ 'config.toml', 'arc-config.toml' ],
}

// Local preferences
let preferences = {
  arc: [ 'preferences.arc', 'prefs.arc' ],
  // TODO add json, yaml, toml later if folks want it?
}

let reads = { projectManifest, functionConfig, preferences }

// Heads up: always put _default last!
module.exports = function read ({ type, cwd }) {
  if (reads[type]) return reader(reads[type], cwd)
  else throw Error('Unknown format read')
}
