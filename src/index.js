let parse = require('@architect/parser')
let read = require('./read')
let inventoryDefaults = require('./defaults')
let config = require('./config')
let getEnv = require('./env')
let validate = require('./validate')
let get = require('./get')
let errorFmt = require('./lib/error-fmt')

/**
 * Architect Inventory
 * - Returns fully enumerated Architect project, including current config for every Lambda
 * - Also returns a handy getter for fetching any config via pragma + Arc item
 *
 * @param {object} params - Contains optional cwd (string) and env (boolean)
 * @returns {object} - Inventory object (including Arc & project defaults and enumerated pragmas) & config getter
 */
module.exports = function architectInventory (params = {}, callback) {
  // Set up promise if there's no callback
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }

  let errors = []

  // Always ensure we have a working dir
  params.cwd = params.cwd || process.cwd()
  let { cwd, rawArc } = params

  // Stateless inventory run
  if (rawArc) {
    try {
      var arc = parse(rawArc)
      var raw = rawArc
      var filepath = false
    }
    catch (err) {
      errors.push(`Problem reading rawArc: ${err.message}`)
    }
  }
  // Get the Architect project manifest from the filesystem
  else {
    var { arc, raw, filepath } = read({ type: 'projectManifest', cwd, errors })
  }

  // Exit early if supplied Arc is fundamentally broken
  if (errors.length) {
    callback(errorFmt({
      type: 'manifest',
      errors,
    }))
    return promise
  }

  // Start building out the inventory
  let inventory = inventoryDefaults(params)

  // Set up project params for config
  let project = { cwd, arc, raw, filepath, inventory }

  // Populate inventory.arc
  inventory._arc = config._arc(project)

  // Establish default function config from project + Arc defaults
  inventory._project = config._project(project, errors)

  // Userland: fill out the pragmas
  inventory = {
    ...inventory,
    ...config.pragmas(project, errors)
  }

  // End here if first-pass pragma validation failed
  if (errors.length) {
    callback(errorFmt({
      type: 'validation',
      errors,
      inventory,
    }))
    return promise
  }

  // Final validation pass
  let err = validate(params, inventory)
  if (err) {
    callback(err)
    return promise
  }

  // Maybe get env vars
  getEnv(params, inventory, function done (err) {
    /* istanbul ignore next: yeah we know what happens here */
    if (err) callback(err)
    else {
      callback(null, {
        inv: inventory,
        get: get(inventory)
      })
    }
  })
  return promise
}
