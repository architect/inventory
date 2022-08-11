let { deepFrozenCopy } = require('@architect/utils')
let { is } = require('../../../lib')

/**
 * Build out resource pragmas (e.g. `@tables`) via plugins
 * Returns an array of resources
 */
function resources (params) {
  let { errors, template, plugins, inventory, type, valid } = params
  if (plugins) {
    let invCopy = deepFrozenCopy(inventory)
    let pluginResults = plugins.flatMap(fn => {
      try {
        var result = fn({ arc: invCopy._project.arc, inventory: { inv: invCopy } })
      }
      catch (err) {
        err.message = `Setter plugin exception: plugin: ${fn._plugin}, method: set.${type}`
                      + `\n` + err.message
        throw err
      }
      if (!result ||
          (!is.object(result) && !is.array(result)) ||
          (is.array(result) && result.some(r => !is.object(r)))) {
        errors.push(`Setter plugins must return a valid response: plugin: ${fn._plugin}, method: set.${type}`)
        return []
      }
      if (is.array(result)) {
        result.forEach((item, i) => {
          item = populateTemplate(template, item)
          item._plugin = fn._plugin
          item._type = fn._type
          result[i] = item
        })
      }
      else {
        result = populateTemplate(template, result)
        result._plugin = fn._plugin
        result._type = fn._type
      }
      return result
    })
    // Validation pass
    let validationErrors = []
    pluginResults.forEach(item => {
      let errors = validate(item, valid, type)
      validationErrors.push(...errors)
    })
    if (validationErrors.length) {
      errors = errors.push(...validationErrors)
      return []
    }
    return pluginResults
  }
  return
}

function populateTemplate (template, item) {
  let newItem = JSON.parse(JSON.stringify(template))
  Object.entries(item).forEach(([ setting, value ]) => {
    if (is.defined(value)) newItem[setting] = value
  })
  return newItem
}

function validate (item, valid, type) {
  if (!valid) return []
  return Object.entries(valid).map(([ setting, value ]) => {
    if (!is[value](item[setting])) return `Invalid plugin-generated @${type} resource: ${setting}: ${item[setting]}`
  }).filter(Boolean)
}

/**
 * Build out settings pragmas (e.g. `@static`) via plugins
 * Returns an object of settings
 */
function settings (params) {
  let { errors, settings, plugins, inventory, type, valid } = params
  let newSettings = is.defined(settings) ? JSON.parse(JSON.stringify(settings)) : settings
  if (plugins) {
    let invCopy = deepFrozenCopy(inventory)
    let foundError = false
    plugins.forEach(fn => {
      try {
        var result = fn({ arc: invCopy._project.arc, inventory: { inv: invCopy } })
      }
      catch (err) {
        err.message = `Setter plugin exception: plugin: ${fn._plugin}, method: set.${type}`
                      + `\n` + err.message
        throw err
      }
      if (!result || !is.object(result)) {
        errors.push(`Setter plugins must return a valid response: plugin: ${fn._plugin}, method: set.${type}`)
        foundError = true
      }
      else {
        Object.entries(result).forEach(([ setting, value ]) => {
          if (is.defined(settings[setting]) && is.defined(value)) {
            newSettings[setting] = value
          }
        })
      }
    })
    if (foundError) return null

    // Validation pass
    let validationErrors = validate(newSettings, valid, type)
    if (validationErrors.length) {
      errors = errors.push(...validationErrors)
      return null
    }

    return newSettings
  }
  return newSettings
}

module.exports = { resources, settings }
