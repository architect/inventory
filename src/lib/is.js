let { existsSync, lstatSync } = require('fs')

module.exports = {
  // Types
  array: item => Array.isArray(item),
  bool: item => typeof item === 'boolean',
  object: item => typeof item === 'object' && !Array.isArray(item),
  string: item => typeof item === 'string',
  // Filesystem
  exists: path => existsSync(path),
  folder: path => lstatSync(path).isDirectory(),
}
