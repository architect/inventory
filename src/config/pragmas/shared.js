let { join } = require('path')
let validate = require('./validate')
let is = require('../../lib/is')
let { lambdas } = require('../../lib/pragmas')

module.exports = function configureShared ({ arc, pragmas, inventory, errors }) {
  if (!pragmas.lambdaSrcDirs) return null

  let cwd = inventory._project.src
  let src = join(cwd, 'src', 'shared')
  let shared = {
    src,
    shared: [] // Revert to null later if none are defined
  }
  if (arc.shared && arc.shared.length) {
    let foundSrc = false

    // First pass to get + check views folder (if any)
    for (let share of arc.shared) {
      if (is.array(share)) {
        let key = share[0].toLowerCase()
        if (key === 'src' && is.string(share[1])) {
          shared.src = share[1]
          foundSrc = true
          validate.shared(shared.src, cwd, errors)
          continue
        }
        if (key === 'src' && !is.string(share[1])) {
          errors.push(`@shared invalid setting: ${key}`)
        }
      }
    }

    // Proceeding from here resets all views config, so make sure it's only if specific views are specified
    let some = !(arc.shared.length === 1 && foundSrc)
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
  }

  // Exit if default views folder doesn't exist
  if (!is.exists(shared.src)) return null

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
