let { isAbsolute, join } = require('path')

/**
 * Get the src (and build) dirs for a Lambda
 * - Arc Lambdas: pass a name + pragma || relative file path
 * - Plugin Lambdas: pass a relative file path || absolute file path
 */
function getLambdaDirs (params, options) {
  let { cwd, item, projSrc, projBuild, type: pragma } = params
  let { name, plugin, customSrc } = options
  let lambdaDirs = {}

  if (plugin) {
    let src = normalizeSrc(cwd, item.src)
    lambdaDirs.src = src
    if (projBuild) {
      lambdaDirs.build = src.replace(cwd, projBuild)
    }
  }
  else {
    let root = customSrc ? cwd : projSrc
    let path = customSrc || join(pragma, name)
    lambdaDirs.src = join(root, path)
    if (projBuild) {
      lambdaDirs.build = join(projBuild, path)
    }
  }
  return lambdaDirs
}

function normalizeSrc (cwd, dir) {
  if (isAbsolute(dir)) return dir
  return join(cwd, dir)
}

getLambdaDirs.normalizeSrc = normalizeSrc
module.exports = getLambdaDirs
