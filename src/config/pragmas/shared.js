let { join } = require('path')
let populate = require('./populate-other')
let validate = require('./validate')
let { is, pragmas } = require('../../lib')
let lambdas = pragmas.lambdas.concat('customLambdas')

module.exports = function configureShared ({ arc, pragmas, inventory, errors }) {
  if (!pragmas.lambdaSrcDirs) return null

  let { cwd, src: projSrc } = inventory._project
  let src = join(projSrc, 'shared')
  let shared = {
    src: null,
    shared: []
  }

  let foundSrcSetting = false
  let pluginSrc = populate.settings({
    errors,
    settings: shared,
    plugins: inventory.plugins?._methods?.set?.shared,
    inventory,
    type: 'shared',
    valid: { src: 'string' },
  })
  // Shared setters only support src, and do not support specifying Lambdas
  // Lambda paths have not yet been reified in Inventory
  if (is.string(pluginSrc?.src)) {
    shared.src = pluginSrc.src
    foundSrcSetting = true
  }

  // First pass to get + check shared folder (if any)
  if (arc?.shared?.length) {
    for (let share of arc.shared) {
      if (is.array(share)) {
        let key = share[0]?.toLowerCase()
        if (key === 'src' && is.string(share[1])) {
          shared.src = share[1]
          foundSrcSetting = true
          continue
        }
        if (key === 'src' && !is.string(share[1])) {
          errors.push(`@shared invalid setting: ${key}`)
        }
      }
    }
  }

  if (foundSrcSetting) validate.shared(shared.src, cwd, errors)
  else shared.src = src

  // Exit if configured shared folder doesn't exist
  if (!is.exists(shared.src)) return null

  // Proceeding from here resets all shared config, so make sure it's only if specific shared are specified
  let some = arc.shared?.length && !(arc?.shared?.length === 1 && foundSrcSetting)
  if (some) {
    // Reset shared settings
    for (let pragma of lambdas) {
      if (!pragmas[pragma]) continue
      for (let { config } of pragmas[pragma]) {
        config.shared = false
      }
    }

    // Set new shared settings
    for (let pragma of arc.shared) {
      if (is.array(pragma)) continue // Bail on src setting
      if (!is.object(pragma)) {
        return errors.push(`@shared invalid setting: ${pragma}`)
      }

      let p = Object.keys(pragma)[0]
      if (!lambdas.includes(p)) {
        return errors.push(`${p} is not a valid @shared pragma`)
      }

      let entries = is.object(pragma[p])
        ? Object.entries(pragma[p])
        : pragma[p]
      for (let lambda of entries) {
        let name = p === 'http' ? lambda.join(' ') : lambda
        let fn = pragmas[p].find(n => n.name === name)
        if (!fn) {
          return errors.push(`@shared ${name} not found in @${p} Lambdas`)
        }
        // Ignore shared into ASAP
        if (!fn.arcStaticAssetProxy) fn.config.shared = true
      }
    }
  }

  // lambda.config.shared was added by function config defaults, or added above
  for (let pragma of lambdas) {
    if (!pragmas[pragma]) continue
    for (let { src, config } of pragmas[pragma]) {
      if (config.shared === true && !shared.shared.includes(src)) {
        shared.shared.push(src)
      }
    }
  }

  return shared
}
