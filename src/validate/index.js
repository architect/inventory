let series = require('run-series')
let layers = require('./layers')
let tablesChildren = require('./tables-children')
let lambdaPragmas = require('../defaults/lambda-pragmas')

/**
 * Final inventory validation
 */
module.exports = function validate (params, inventory, callback) {
  let { region } = inventory.aws
  let { cwd, validateLayers = true } = params

  // Walk the tree of layer configs, starting with @aws
  let layerValidations = []
  Object.entries(inventory).forEach(([ i ]) => {
    let item = inventory[i]
    if (i === 'aws') {
      let location = inventory._project.manifest &&
                     inventory._project.manifest.replace(cwd, '')
      let layers = item.layers
      layerValidations.push({ layers, region, location })
    }
    else if (lambdaPragmas.some(p => p === i) && item) {
      item.forEach(entry => {
        // Probably unnecessary if no configFile is present but why not, let's be extra safe
        let location = entry.configFile && entry.configFile.replace(cwd, '')
        let layers = entry.config.layers
        layerValidations.push({ layers, region, location })
      })
    }
  })

  let validations = layerValidations.map(params => {
    return function (callback) {
      if (validateLayers) layers(params, callback)
      else callback()
    }
  })

  // Ensure @tables children (@streams, @indexes) have parent tables present
  validations.push(function (callback) {
    tablesChildren(inventory, callback)
  })

  series(validations, callback)
}
