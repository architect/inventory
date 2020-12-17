let { join } = require('path')
let { existsSync } = require('fs')

module.exports = function asapSrc () {
  // Inventory running as an arc/arc dependency (most common use case)
  let src = join(process.cwd(), 'node_modules', '@architect', 'asap', 'dist')
  // Inventory running in arc/arc as a global install
  let global = join(__dirname, '..', '..', '..', 'asap', 'dist')
  // Inventory running from a local (symlink) context (usually testing/dev)
  let local = join(__dirname, '..', '..', 'node_modules', '@architect', 'asap', 'dist')
  if (!existsSync(src) && existsSync(global)) src = global
  else if (!existsSync(src) && existsSync(local)) src = local

  return src
}
