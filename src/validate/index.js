let validateLayers = require('./layers')
let validateTablesChildren = require('./tables-children')

/**
 * Final inventory validation
 */
module.exports = function validate (inventory) {
  let { region } = inventory.aws

  let lambdaTypes = [
    'events',
    'http',
    'queues',
    'schduled',
    'streams',
    'ws',
  ]

  // Walk the tree of layer configs
  Object.entries(inventory).forEach(([ i ]) => {
    let item = inventory[i]
    if (i === 'aws') {
      let loc = inventory.project.manifest.replace(process.cwd(), '')
      validateLayers(item.layers, region, loc)

    }
    else if (lambdaTypes.some(p => p === i) && item) {
      item.forEach(entry => {
        // Probably unnecessary if no configFile is present but why not, let's be extra safe
        let loc = entry.configFile && entry.configFile.replace(process.cwd(), '')
        validateLayers(entry.config.layers, region, loc)
      })
    }
  })

  // Ensure @tables children (@streams, @indexes) have parent tables present
  validateTablesChildren(inventory)
}
