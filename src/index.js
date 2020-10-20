let readArc = require('./read/arc')
let series = require('run-series')
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

  // Always ensure we have a working dir
  params.cwd = params.cwd || process.cwd()
  let { cwd } = params

  let { arc, raw, filepath } = readArc({ cwd })
  let errors

  // Start building out the inventory
  let inventory = inventoryDefaults(params)

  // Set up project params for config
  let project = { cwd, arc, raw, filepath, inventory }

  // Populate inventory.arc
  inventory.arc = config.arc(project)

  // Establish default function config from project + Arc defaults
  inventory.project = config.project(project)

  // Userland: fill out the pragmas
  try {
    inventory = {
      ...inventory,
      ...config.pragmas(project)
    }
  }
  catch (err) {
    errors = err
  }

  series([
    // End here if first-pass pragma validation failed
    function _pragmaValidationFailed (callback) {
      if (errors) callback(errors)
      else callback()
    },

    // Populate environment variables
    function _getEnv (callback) {
      getEnv(params, inventory, function done (err, env) {
        if (err) callback(err)
        else {
          inventory.project.env = env
          callback()
        }
      })
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
        inventory,
        get: get(inventory)
      })
    }
  })

  return promise
}
