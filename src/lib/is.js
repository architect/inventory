let { existsSync, lstatSync } = require('fs')

module.exports = {
  // Types
  array: item => Array.isArray(item),
  bool: item => typeof item === 'boolean',
  number: item => Number.isInteger(item),
  object: item => typeof item === 'object' && !Array.isArray(item),
  string: item => typeof item === 'string',
  defined: item => typeof item !== 'undefined' && item !== null,
  // Filesystem
  exists: path => existsSync(path),
  folder: path => existsSync(path) && lstatSync(path).isDirectory(),
  // Pragma-specific stuff
  primaryKey: val => typeof val === 'string' && (val.startsWith('*String') || val.startsWith('*Number')),
  sortKey: val => typeof val === 'string' && (val.startsWith('**String') || val.startsWith('**Number')),
}
