let { join } = require('path')
let test = require('tape')
let mockFs = require('mock-fs')
let cwd = process.cwd()
let sut = join(cwd, 'src', 'config', 'pragmas', 'populate-lambda', 'get-handler')
let fnConfig = join(cwd, 'src', 'defaults', 'function-config')
let getHandler = require(sut)
let defaultFunctionConfig = require(fnConfig)

let isWin = process.platform.startsWith('win')
let src = join('src', 'foo')
let srcPath = file => join(src, file)
let file = 'index'
let handler = 'handler'
let buildSubpath = 'target'
let bootstrap = `bootstrap${isWin ? '.exe' : ''}`
function fakeFile (file, contents = 'hi') {
  return { [src]: { [file]: contents } }
}

test('Set up env', t => {
  t.plan(2)
  t.ok(getHandler, 'Handler getter is present')
  t.ok(defaultFunctionConfig, 'Default function config is present')
})

test('Handler properties (built-in runtimes)', t => {
  t.plan(20)
  let config, errors, result

  // Defaults to Node.js
  config = defaultFunctionConfig()
  errors = []
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.mjs`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)

  // Assume Node will keep being developed and keyed by AWS starting with `nodejs`
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'nodejs14.x'
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.mjs`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)

  // Python
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'python3.8'
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.py`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Ruby
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'ruby2.7'
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.rb`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Deno
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'deno'
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`mod.ts`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Other / unknown
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'go1.x'
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(file), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
})

test('Handler properties (Node.js module systems)', t => {
  t.plan(28)
  // Not going to bother checking handlerMethod here, assuming we got that right above
  let config, errors, result

  // 14
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'nodejs14.x'
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.mjs`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)

  // .js
  config = defaultFunctionConfig()
  errors = []
  mockFs(fakeFile(`${file}.js`))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.js`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'cjs', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockFs.restore()

  // .cjs
  config = defaultFunctionConfig()
  errors = []
  mockFs(fakeFile(`${file}.cjs`))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.cjs`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'cjs', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockFs.restore()

  // CJS via package.json (implied)
  config = defaultFunctionConfig()
  errors = []
  mockFs(fakeFile(`package.json`, JSON.stringify({})))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.js`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'cjs', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockFs.restore()

  // CJS via package.json (explicit)
  config = defaultFunctionConfig()
  errors = []
  mockFs(fakeFile(`package.json`, JSON.stringify({ type: 'commonjs' })))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.js`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'cjs', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockFs.restore()

  // .mjs
  config = defaultFunctionConfig()
  errors = []
  mockFs(fakeFile(`${file}.mjs`))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.mjs`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockFs.restore()

  // .mjs in the root with a project package.json
  config = defaultFunctionConfig()
  errors = []
  mockFs({ [src]: {
    [`${file}.mjs`]: 'hi',
    'package.json': JSON.stringify({})
  } })
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.mjs`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockFs.restore()

  // ESM via package.json
  config = defaultFunctionConfig()
  errors = []
  mockFs(fakeFile(`package.json`, JSON.stringify({ type: 'module' })))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.js`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockFs.restore()

  // Invalid package.json
  config = defaultFunctionConfig()
  errors = []
  mockFs(fakeFile(`package.json`))
  result = getHandler({ config, src, errors })
  t.equal(errors.length, 1, 'Got handler error')
  t.match(errors[0], /Unexpected token/, 'Got correct error')
  mockFs.restore()

  // Invalid 'type' field
  config = defaultFunctionConfig()
  errors = []
  mockFs(fakeFile(`package.json`, JSON.stringify({ type: 'lolidk' })))
  result = getHandler({ config, src, errors })
  t.equal(errors.length, 1, 'Got handler error')
  t.match(errors[0], /Invalid 'type' field/, 'Got correct error')
  mockFs.restore()
})

test('Handler properties (Deno)', t => {
  t.plan(14)
  // Not going to bother checking handlerMethod here, assuming we got that right above
  let config, errors, result, denoHandler
  let deno = 'deno'

  // Default
  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`mod.ts`), `Got correct handlerFile: ${result.handlerFile}`)

  // Explicitly defined
  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'index.js'
  mockFs(fakeFile(denoHandler))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(denoHandler), `Got correct handlerFile: ${result.handlerFile}`)
  mockFs.restore()

  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'mod.js'
  mockFs(fakeFile(denoHandler))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(denoHandler), `Got correct handlerFile: ${result.handlerFile}`)
  mockFs.restore()

  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'index.ts'
  mockFs(fakeFile(denoHandler))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(denoHandler), `Got correct handlerFile: ${result.handlerFile}`)
  mockFs.restore()

  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'mod.ts'
  mockFs(fakeFile(denoHandler))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(denoHandler), `Got correct handlerFile: ${result.handlerFile}`)
  mockFs.restore()

  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'index.tsx'
  mockFs(fakeFile(denoHandler))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(denoHandler), `Got correct handlerFile: ${result.handlerFile}`)
  mockFs.restore()

  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'mod.tsx'
  mockFs(fakeFile(denoHandler))
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(denoHandler), `Got correct handlerFile: ${result.handlerFile}`)
  mockFs.restore()
})

test('Custom runtime properties', t => {
  t.plan(24)
  let build = '.some-build-dir'
  let handlerFile, config, errors, result

  // Known built-in runtime
  config = defaultFunctionConfig()
  errors = []
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.mjs`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Transpiled to an interpreted runtime, no specified handlerFile
  config = defaultFunctionConfig()
  config.runtime = 'typescript'
  errors = []
  config.runtimeConfig = { type: 'transpiled', baseRuntime: 'nodejs14.x' }
  result = getHandler({ config, src, build, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(build, `${file}.js`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Transpiled to an interpreted runtime, with specified handlerFile
  config = defaultFunctionConfig()
  handlerFile = 'custom-handler-file.js'
  config.runtime = 'typescript'
  errors = []
  config.runtimeConfig = { type: 'transpiled', baseRuntime: 'nodejs14.x', handlerFile }
  result = getHandler({ config, src, build, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(build, `${handlerFile}`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Compiled to a binary, no specified handlerFile
  config = defaultFunctionConfig()
  handlerFile = 'custom-handler-file'
  config.runtime = 'rust'
  errors = []
  config.runtimeConfig = { type: 'compiled', handlerFile }
  result = getHandler({ config, src, build, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(build, `${handlerFile}`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, null, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Compiled to a binary, with a build subpath
  config = defaultFunctionConfig()
  config.runtime = 'rust'
  errors = []
  config.runtimeConfig = { type: 'compiled', buildSubpath }
  result = getHandler({ config, src, build, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(build, buildSubpath, bootstrap), `Got correct handlerFile: ${join(build, buildSubpath, bootstrap)}`)
  t.equal(result.handlerMethod, null, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Compiled to a binary, with specified handlerFile
  config = defaultFunctionConfig()
  config.runtime = 'rust'
  errors = []
  config.runtimeConfig = { type: 'compiled' }
  result = getHandler({ config, src, build, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(build, bootstrap), `Got correct handlerFile: ${join(build, bootstrap)}`)
  t.equal(result.handlerMethod, null, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Interpreted custom runtime, no specified handlerFile
  config = defaultFunctionConfig()
  config.runtime = 'php'
  errors = []
  config.runtimeConfig = { type: 'interpreted' }
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`index`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Interpreted custom runtime, with specified handlerFile
  config = defaultFunctionConfig()
  handlerFile = 'index.php'
  config.runtime = 'php'
  errors = []
  config.runtimeConfig = { type: 'interpreted', handlerFile }
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${handlerFile}`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
})

test('@ population', t => {
  t.plan(2)
  let config
  let errors

  config = defaultFunctionConfig()
  errors = []
  config.handler = 'whatev'
  getHandler({ config, src, errors })
  t.ok(errors.length, 'Got invalid handler error')

  config = defaultFunctionConfig()
  errors = []
  config.handler = 'whatev.thing.yo'
  getHandler({ config, src, errors })
  t.ok(errors.length, 'Got invalid handler error')
})
