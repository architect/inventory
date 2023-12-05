let { join } = require('path')
let { existsSync } = require('fs')

module.exports = function asapSrc (params = {}) {
  let { _testing } = params
  let dirname = _testing ? _testing : __dirname
  // Inventory running as an arc/arc dependency (most common use case)
  let src = join(process.cwd(), 'node_modules', '@architect', 'asap', 'src')
  if (existsSync(src)) return src

  // Inventory running in arc/arc as a global install
  let global = join(dirname, '..', '..', '..', 'asap', 'src')
  if (existsSync(global)) return global

  // Inventory running from a local (symlink) context (usually testing/dev)
  let local = join(dirname, '..', '..', 'node_modules', '@architect', 'asap', 'src')
  if (existsSync(local)) return local

  try {
    return require.resolve('@architect/asap')
  }
  catch {
    /* istanbul ignore next */
    throw Error('Cannot find ASAP module!')
  }
}
