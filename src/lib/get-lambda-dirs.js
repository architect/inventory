let { join } = require('path')
let normalizeSrcDir = require('./normalize-src')

/**
 * Get the src (and build) dirs for a Lambda
 * - Arc Lambdas: pass a name + pragma || relative file path
 * - Plugin Lambdas: pass a relative file path || absolute file path
 */
module.exports = function getLambdaDirs (params, options) {
  let { cwd, item, projSrc, projBuild, type: pragma } = params
  let { name, plugin, customSrc } = options
  let lambdaDirs = {}

  if (plugin) {
    let src = normalizeSrcDir(cwd, item.src)
    lambdaDirs.src = src
    if (projBuild) {
      lambdaDirs.build = src.replace(src, projBuild)
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
