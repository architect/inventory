let { join, resolve, sep } = require('path')
let { is } = require('../../../lib')

module.exports = function validateShared (src, cwd, errors) {
  let path = src && src.startsWith(cwd) ? src : resolve(join(cwd, src))

  if (!is.exists(path)) errors.push(`Directory not found: ${src}`)
  else if (!is.folder(path)) errors.push(`Must be a directory: ${src}`)

  let valid = path && path.startsWith(cwd) &&
              (cwd.split(sep) < path.split(sep))
  if (!valid) errors.push(`Directory must be a subfolder of this project: ${src}`)
}
