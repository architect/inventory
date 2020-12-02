let { join, resolve, sep } = require('path')
let is = require('../../../lib/is')

module.exports = function validateShared (src, cwd) {
  let path = src && resolve(join(cwd, src))

  if (!is.exists(path)) {
    throw Error(`Directory not found: ${src}`)
  }
  if (!is.folder(path)) {
    throw Error(`Must be a directory: ${src}`)
  }
  let valid = path && path.startsWith(cwd) &&
              (cwd.split(sep) < path.split(sep))
  if (!valid) throw Error(`Directory must be a subfolder of this project: ${src}`)
}
