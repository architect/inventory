let { join } = require('path')
let { existsSync, readFileSync } = require('fs')

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
    handlerFile = join(build, runtimeConfig.handlerFile || 'handler')
  }
  // Interpreted
  else if (customRuntimeType === 'interpreted') {
    handlerFile = join(src, runtimeConfig.handlerFile || 'index')
  }

  let handlerConfig = { handlerFile, handlerMethod, handlerModuleSystem }
  return handlerConfig
}

let nodeHandlers = [ 'index.js', 'index.mjs', 'index.cjs' ]
let denoHandlers = [ 'index.js', 'mod.js', 'index.ts', 'mod.ts', 'index.tsx', 'mod.tsx' ]

function getExt ({ runtime, src, errors }) {
  try {
    if (runtime.startsWith('node')) {
      if (runtime === 'nodejs12.x') {
        return { ext: 'js', handlerModuleSystem: 'cjs' }
      }
      // This presumes Node.js 14.x+ Lambda releases use the same CJS/ESM pattern
      else {
        let { file, ext = 'js' } = findHandler(nodeHandlers, src)
        let handlerModuleSystem = ext === 'mjs' ? 'esm' : 'cjs'
        let pkgFile = join(src, 'package.json')
        if (existsSync(pkgFile)) {
          let pkg = JSON.parse(readFileSync(pkgFile))
          handlerModuleSystem = getModSystem(pkg)
        }
        return { file, ext, handlerModuleSystem }
      }
    }
    if (runtime.startsWith('python')) return { ext: 'py' }
    if (runtime.startsWith('ruby')) return { ext: 'rb' }
    if (runtime.startsWith('deno')) {
      let { file, ext = 'ts' } = findHandler(denoHandlers, src)
      return { file, ext }
    }
    return { ext: '' }
  }
  catch (err) {
    errors.push(`Error getting Lambda handler in ${src}: ${err.message}`)
    return {}
  }
}

function findHandler (arr, src){
  for (let handler of arr) {
    if (existsSync(join(src, handler))) {
      let bits = handler.split('.')
      return { file: bits[0], ext: bits[1] }
    }
  }
  return {}
}

function getModSystem (pkg) {
  if (pkg?.type === 'module') return 'esm'
  else if (pkg?.type === 'commonjs') return 'cjs'
  else if (pkg?.type) throw Error(`Invalid 'type' field: ${pkg.type}`)
  return 'cjs'
}
