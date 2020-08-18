let { readArc } = require('@architect/parser')
let inventoryDefaults = require('./defaults')
let config = require('./config')
let validate = require('./validate')
// let get = require('./get')

/**
 * Architect Inventory
 * - Returns fully enumerated Architect project, including current config for every Lambda
 * - Also returns a handy getter for fetching any config via pragma + Arc item
 *
 * @param {object} params - Contains optional cwd
 * @returns {object} - Inventory object (including Arc & project defaults and enumerated pragmas) & config getter
 */
module.exports = function architectInventory (params = {}) {
  let { cwd } = params
  cwd = cwd || process.cwd()
  let { arc, raw, filepath, errors } = readArc({ cwd })
  if (errors) {
    throw ReferenceError(errors)
  }

  // Start building out the inventory
  let inventory = inventoryDefaults()

  // Set up project params for config
  let project = { cwd, arc, raw, filepath, inventory }

  // Populate inventory.arc
  inventory = config.arc(project)

  // Establish default function config from project + Arc defaults
  inventory = config.project(project)

  // Fill out the pragmas
  inventory = config.pragmas(project)

  // One final validation pass
  validate(inventory)

  return {
    inventory,
    // get: get.bind({}, inventory)
  }
}
