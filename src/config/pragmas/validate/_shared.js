let { join, resolve, sep } = require('path')
let { is } = require('../../../lib')

module.exports = function validateShared (src, cwd, errors, required) {
  let path = src?.startsWith(cwd) ? src : resolve(join(cwd, src))

  if (is.exists(path) && !is.folder(path)) errors.push(`Must be a directory: ${src}`)
  else if (!is.exists(path) && required) errors.push(`Directory not found: ${src}`)

  let valid = path?.startsWith(cwd) && (cwd.split(sep) < path.split(sep))
  if (!valid) errors.push(`Directory must be a subfolder of this project: ${src}`)
}
