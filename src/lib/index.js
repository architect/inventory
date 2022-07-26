let asapSrc = require('./asap-src')
let errorFmt = require('./error-fmt')
let getLambdaDirs = require('./get-lambda-dirs')
let is = require('./is')
let mergeEnvVars = require('./merge-env-vars')
let pragmas = require('./pragmas')

/**
 * Why take up a whole fs block when smol libs can just live here?
 */

// Capitalize a string (used to normalize table/index key types)
let capitalize = str => str[0].toUpperCase() + str.substr(1)

// For setting `lambda.build`, compiled + transpiled are effectively the same
let compiledRuntimes = [ 'compiled', 'transpiled' ]

// `any` must come last for Sandbox route sorting purposes
let httpMethods = [ 'get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'any' ]

let validationPatterns = {
  strictName: /^[a-z][a-z0-9-]+$/,
  looseName: /^[a-z][a-zA-Z0-9-_]+$/,
  looserName: /^[a-z][a-zA-Z0-9-._]+$/,
  veryLooseName: /^[a-zA-Z0-9/\-._]*$/,
  // IEEE 1003.1-2001 does not allow lowercase, so consider this a compromise for the Windows folks in the house
  envVar: /^[a-zA-Z0-9_]+$/,
}

// Error tidier: remove the error name, just print the message + stack data
let tidyError = err => err.message + `\n` + err.stack.split('\n').slice(1).join('\n')

module.exports = {
  asapSrc,
  capitalize,
  compiledRuntimes,
  errorFmt,
  getLambdaDirs,
  httpMethods,
  is,
  mergeEnvVars,
  normalizeSrc: getLambdaDirs.normalizeSrc,
  pragmas,
  tidyError,
  validationPatterns,
}
