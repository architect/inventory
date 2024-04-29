let { join } = require('path')
let { existsSync, readFileSync } = require('fs')
let isWin = process.platform.startsWith('win')

module.exports = function getHandler ({ config, src, build, errors }) {
  let { handler, runtime, runtimeConfig } = config
  let parts = handler.split('.') // Default is 'index.handler'
  if (parts.length !== 2) {
    errors.push(`Invalid handler: ${handler}. Expected {file}.{method}, example: index.handler`)
  }

  let { file, ext, handlerModuleSystem } = getExt({ runtime, src, errors })
  file = file || parts[0] // Falls back to 'index'
  ext = ext ? '.' + ext : ''
  let handlerFile = join(src, `${file}${ext}`)
  let handlerMethod = parts[1]
  let customRuntimeType = runtimeConfig?.type

  // Compiled to an interpreted runtime (eg TypeScript)
  if (customRuntimeType === 'transpiled') {
    handlerFile = join(build, runtimeConfig?.handlerFile || 'index.js')
  }
  // Compiled to a binary
  else if (customRuntimeType === 'compiled') {
    /* istanbul ignore next */
    let bootstrap = `bootstrap${isWin ? '.exe' : ''}`
    handlerFile = join(build, runtimeConfig.buildSubpath || '', runtimeConfig.handlerFile || bootstrap)
    handlerMethod = null
  }
  // Interpreted
  else if (customRuntimeType === 'interpreted') {
    handlerFile = join(src, runtimeConfig.handlerFile || 'index')
  }

  let handlerConfig = { handlerFile, handlerMethod, handlerModuleSystem }
  return handlerConfig
}

// As of nodejs14.x, CJS remains the default over ESM when both are present
let nodeHandlers = [ 'index.js', 'index.mjs', 'index.cjs' ]
let denoHandlers = [ 'mod.ts', 'mod.js' ]
  // TODO: these are all prob going away
  .concat([ 'mod.tsx', 'index.ts', 'index.js', 'index.tsx' ])
let rubyHandlers = [ 'lambda.rb', 'handler.rb', 'index.rb' ]
let snekHandlers = [ 'lambda.py', 'handler.py', 'index.py' ]

function getExt ({ runtime, src, errors }) {
  try {
    if (runtime.startsWith('node')) {
      // This presumes Node.js ≥14 Lambda releases use the same CJS/ESM pattern
      // Generally in Lambda: CJS wins, but in Architect-land we attempt to default to ESM
      let { file, ext } = findHandler(nodeHandlers, src)

      // Early return on extensions that imply module type
      if (ext === 'mjs') return { file, ext, handlerModuleSystem: 'esm' }
      if (ext === 'cjs') return { file, ext, handlerModuleSystem: 'cjs' }

      // In the odd case that there only exists an `index` file (no ext), default to ESM and let other things blow up when it's not found
      ext = ext || 'mjs'
      let handlerModuleSystem = ext === 'mjs' ? 'esm' : 'cjs'

      let pkgFile = join(src, 'package.json')
      if (existsSync(pkgFile)) {
        let pkg = JSON.parse(readFileSync(pkgFile))

        /**/ if (pkg?.type === 'module') handlerModuleSystem = 'esm'
        else if (pkg?.type === 'commonjs') handlerModuleSystem = 'cjs'
        else if (pkg?.type) throw Error(`Invalid 'type' field: ${pkg.type}`)
        else handlerModuleSystem = 'cjs' // Lambda's default, not ours

        // We always get to make this a .js file, even if it's ESM!
        ext = 'js'
      }
      return { file, ext, handlerModuleSystem }
    }
    if (runtime.startsWith('python')) {
      let { file = 'lambda', ext = 'py' } = findHandler(snekHandlers, src)
      return { file, ext }
    }
    if (runtime.startsWith('ruby')) {
      let { file = 'lambda', ext = 'rb' } = findHandler(rubyHandlers, src)
      return { file, ext }
    }
    if (runtime.startsWith('deno')) {
      let { file = 'mod', ext = 'ts' } = findHandler(denoHandlers, src)
      return { file, ext }
    }
    return { ext: '' }
  }
  catch (err) {
    errors.push(`Error getting Lambda handler in ${src}: ${err.message}`)
    return {}
  }
}

function findHandler (arr, src) {
  for (let handler of arr) {
    if (existsSync(join(src, handler))) {
      let bits = handler.split('.')
      return { file: bits[0], ext: bits[1] }
    }
  }
  return {}
}
