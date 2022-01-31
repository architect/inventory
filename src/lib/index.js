let asapSrc = require('./asap-src')
let errorFmt = require('./error-fmt')
let getLambdaDirs = require('./get-lambda-dirs')
let is = require('./is')
let mergeEnvVars = require('./merge-env-vars')
let pragmas = require('./pragmas')

/**
 * Why take up a whole fs block when smol libs can just live here?
 */

// For setting `lambda.build`, compiled + transpiled are effectively the same
let compiledRuntimes = [ 'compiled', 'transpiled' ]

// `any` must come last for Sandbox route sorting purposes
let httpMethods = [ 'get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'any' ]

let validationPatterns = {
  strictName: /^[a-z][a-z0-9-]+$/,
  looseName: /^[a-z][a-zA-Z0-9-_]+$/,
  looserName: /^[a-z][a-zA-Z0-9-._]+$/,
  veryLooseName: /^[a-zA-Z0-9/\-._]*$/,
}

module.exports = {
  asapSrc,
  compiledRuntimes,
  errorFmt,
  getLambdaDirs,
  httpMethods,
  is,
  mergeEnvVars,
  normalizeSrc: getLambdaDirs.normalizeSrc,
  pragmas,
  validationPatterns,
}
