let { basename } = require('path')
let parser = require('@architect/parser')
let series = require('run-series')
let read = require('./read')
let inventoryDefaults = require('./defaults')
let config = require('./config')
let getEnv = require('./env')
let validate = require('./validate')
let get = require('./get')

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
      var arc = parser(rawArc)
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
    let err = Error(`Project manifest error: ${errors[0]}`)
    callback(err)
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
  series([
    // End here if first-pass pragma validation failed
    function _pragmaValidationFailed (callback) {
      if (errors.length) {
        let arcFile = inventory._project.manifest
          ? ` in ${basename(inventory._project.manifest)}`
          : ''
        let output = errors.map(err => `- ${err}`).join('\n')
        let err = Error(`Validation error${errors.length > 1 ? 's' : ''}${arcFile}\n${output}`)
        callback(err)
      }
      else callback()
    },

    // Populate environment variables
    function _getEnv (callback) {
      getEnv(params, inventory, callback)
    },

    // Final validation pass
    function _validate (callback) {
      validate(params, inventory, callback)
    }
  ],
  function done (err) {
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
