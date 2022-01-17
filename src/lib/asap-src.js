let { join } = require('path')
let { existsSync } = require('fs')

module.exports = function asapSrc () {
  // Inventory running as an arc/arc dependency (most common use case)
  let src = join(process.cwd(), 'node_modules', '@architect', 'asap', 'src')
  if (existsSync(src)) return src

  // Inventory running in arc/arc as a global install
  let global = join(__dirname, '..', '..', '..', 'asap', 'src')
  if (existsSync(global)) return global

  // Inventory running from a local (symlink) context (usually testing/dev)
  let local = join(__dirname, '..', '..', 'node_modules', '@architect', 'asap', 'src')
  if (existsSync(local)) return local

  try {
    return require.resolve('@architect/asap')
  }
  catch (err) {
    throw Error('Cannot find ASAP module!')
  }
}
