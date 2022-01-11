let asapSrc = require('./asap-src')
let errorFmt = require('./error-fmt')
let getLambdaDirs = require('./get-lambda-dirs')
let is = require('./is')
let pragmas = require('./pragmas')

/**
 * Why take up a whole fs block when smol libs can just live here?
 */

// For setting `lambda.build`, compiled + transpiled are effectively the same
let compiledRuntimes = [ 'compiled', 'transpiled' ]

// `any` must come last for Sandbox route sorting purposes
let httpMethods = [ 'get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'any' ]

module.exports = {
  asapSrc,
  compiledRuntimes,
  errorFmt,
  getLambdaDirs,
  normalizeSrc: getLambdaDirs.normalizeSrc,
  httpMethods,
  is,
  pragmas,
}
