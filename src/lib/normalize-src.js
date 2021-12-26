let { join } = require('path')

module.exports = function normalizeSrcDir (cwd, dir) {
  if (!dir.startsWith(cwd)) return join(cwd, dir)
  return dir
}
