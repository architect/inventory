let { join } = require('path')
let test = require('tape')
let mockTmp = require('mock-tmp')
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
  t.plan(38)
  let config, cwd, errors, pythonHandler, rubyHandler, result

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
  config.runtime = 'nodejs22.x'
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.mjs`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)

  // Python
  config = defaultFunctionConfig()
  errors = []
  pythonHandler = 'lambda.py'
  config.runtime = 'python3.13'
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(pythonHandler), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Verify priority of the updated default handler name
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp({ [src]: {
    [pythonHandler]: 'hi',
    'index.py': 'hi',
  } })
  config.runtime = 'python3.13'
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(pythonHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
  mockTmp.reset()

  config = defaultFunctionConfig()
  errors = []
  pythonHandler = 'handler.py'
  cwd = mockTmp(fakeFile(pythonHandler))
  config.runtime = 'python3.13'
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(pythonHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
  mockTmp.reset()

  // Old school Architect default
  config = defaultFunctionConfig()
  errors = []
  pythonHandler = 'index.py'
  cwd = mockTmp(fakeFile(pythonHandler))
  config.runtime = 'python3.13'
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(pythonHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
  mockTmp.reset()

  // Ruby
  config = defaultFunctionConfig()
  errors = []
  rubyHandler = 'lambda.rb'
  config.runtime = 'ruby3.3'
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(rubyHandler), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Verify priority of the updated default handler name
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp({ [src]: {
    [rubyHandler]: 'hi',
    'index.rb': 'hi',
  } })
  config.runtime = 'ruby3.3'
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(rubyHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
  mockTmp.reset()

  config = defaultFunctionConfig()
  errors = []
  rubyHandler = 'handler.rb'
  cwd = mockTmp(fakeFile(rubyHandler))
  config.runtime = 'ruby3.3'
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(rubyHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
  mockTmp.reset()

  // Old school Architect default
  config = defaultFunctionConfig()
  errors = []
  rubyHandler = 'index.rb'
  cwd = mockTmp(fakeFile(rubyHandler))
  config.runtime = 'ruby3.3'
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(rubyHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
  mockTmp.reset()

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
  let config, cwd, errors, result

  // 14
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'nodejs22.x'
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, srcPath(`${file}.mjs`), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)

  // .js
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp(fakeFile(`${file}.js`))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(`${file}.js`)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'cjs', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockTmp.reset()

  // .cjs
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp(fakeFile(`${file}.cjs`))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(`${file}.cjs`)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'cjs', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockTmp.reset()

  // CJS via package.json (implied)
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp(fakeFile(`package.json`, JSON.stringify({})))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(`${file}.js`)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'cjs', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockTmp.reset()

  // CJS via package.json (explicit)
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp(fakeFile(`package.json`, JSON.stringify({ type: 'commonjs' })))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(`${file}.js`)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'cjs', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockTmp.reset()

  // .mjs
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp(fakeFile(`${file}.mjs`))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(`${file}.mjs`)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockTmp.reset()

  // .mjs in the root with a project package.json
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp({ [src]: {
    [`${file}.mjs`]: 'hi',
    'package.json': JSON.stringify({}),
  } })
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(`${file}.mjs`)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockTmp.reset()

  // ESM via package.json
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp(fakeFile(`package.json`, JSON.stringify({ type: 'module' })))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(`${file}.js`)), `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerModuleSystem, 'esm', `Got correct handlerModuleSystem: ${result.handlerModuleSystem}`)
  mockTmp.reset()

  // Invalid package.json
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp(fakeFile(`package.json`))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.equal(errors.length, 1, 'Got handler error')
  t.match(errors[0], /Unexpected token/, 'Got correct error')
  mockTmp.reset()

  // Invalid 'type' field
  config = defaultFunctionConfig()
  errors = []
  cwd = mockTmp(fakeFile(`package.json`, JSON.stringify({ type: 'lolidk' })))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.equal(errors.length, 1, 'Got handler error')
  t.match(errors[0], /Invalid 'type' field/, 'Got correct error')
  mockTmp.reset()
})

test('Handler properties (Deno)', t => {
  t.plan(14)
  // Not going to bother checking handlerMethod here, assuming we got that right above
  let config, cwd, errors, result, denoHandler
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
  cwd = mockTmp(fakeFile(denoHandler))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(denoHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  mockTmp.reset()

  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'mod.js'
  cwd = mockTmp(fakeFile(denoHandler))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(denoHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  mockTmp.reset()

  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'index.ts'
  cwd = mockTmp(fakeFile(denoHandler))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(denoHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  mockTmp.reset()

  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'mod.ts'
  cwd = mockTmp(fakeFile(denoHandler))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(denoHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  mockTmp.reset()

  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'index.tsx'
  cwd = mockTmp(fakeFile(denoHandler))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(denoHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  mockTmp.reset()

  config = defaultFunctionConfig()
  errors = []
  config.runtime = deno
  denoHandler = 'mod.tsx'
  cwd = mockTmp(fakeFile(denoHandler))
  result = getHandler({ config, src: join(cwd, src), errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, join(cwd, srcPath(denoHandler)), `Got correct handlerFile: ${result.handlerFile}`)
  mockTmp.reset()
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
