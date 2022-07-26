let { existsSync, lstatSync } = require('fs')

// Types
let array = item => Array.isArray(item)
let bool = item => typeof item === 'boolean'
let defined = item => typeof item !== 'undefined'
let fn = item => typeof item === 'function'
let nullish = item => typeof item === 'undefined' || item === null
let number = item => Number.isInteger(item)
let object = item => typeof item === 'object' && !Array.isArray(item)
let string = item => typeof item === 'string'
// Filesystem
let exists = path => existsSync(path)
let folder = path => existsSync(path) && lstatSync(path).isDirectory()
// Pragma-specific stuff
let primaryKey = val => string(val) && [ '*', '*string', '*number' ].includes(val.toLowerCase())
let sortKey = val => string(val) && [ '**', '**string', '**number' ].includes(val.toLowerCase())

module.exports = {
  array,
  bool,
  defined,
  fn,
  nullish,
  number,
  object,
  string,
  exists,
  folder,
  primaryKey,
  sortKey,
}
