let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'populate-lambda', 'get-handler')
let fnConfig = join(process.cwd(), 'src', 'defaults', 'function-config')
let getHandler = require(sut)
let defaultFunctionConfig = require(fnConfig)

test('Set up env', t => {
  t.plan(2)
  t.ok(getHandler, 'Handler getter is present')
  t.ok(defaultFunctionConfig, 'Default function config is present')
})

test('Handler properties', t => {
  t.plan(18)
  let src = 'src/foo'
  let file = 'whatev'
  let handler = 'handler'
  let config
  let errors
  let result

  // Defaults to Node.js
  config = defaultFunctionConfig()
  errors = []
  config.handler = `${file}.${handler}`
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.js`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Assume Node will keep being developed and keyed by AWS starting with `nodejs`
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'nodejs14.x'
  config.handler = `${file}.${handler}`
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.js`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Python
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'python3.8'
  config.handler = `${file}.${handler}`
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.py`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Ruby
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'ruby2.7'
  config.handler = `${file}.${handler}`
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.rb`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Deno
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'deno'
  config.handler = `${file}.${handler}`
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.ts`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Other / unknown
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'go1.x'
  config.handler = `${file}.${handler}`
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)
})

test('Custom runtime properties', t => {
  t.plan(21)
  let src = 'src/foo'
  let build = '.some-build-dir'
  let file = 'whatev'
  let handler = 'handler'
  let handlerFile
  let handlerMethod
  let config
  let errors
  let result

  // Known built-in runtime, no handler config (natch)
  config = defaultFunctionConfig()
  errors = []
  config.handler = `${file}.${handler}`
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.js`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Compiled to an interpreted runtime, no specified handlerFile
  config = defaultFunctionConfig()
  config.runtime = 'typescript'
  errors = []
  config.handler = `${file}.${handler}`
  config.runtimeConfig = { baseRuntime: 'nodejs14.x' }
  result = getHandler({ config, src, build, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${build}/${file}.js`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Compiled to an interpreted runtime, with specified handlerFile
  config = defaultFunctionConfig()
  handlerFile = 'custom-handler-file.js'
  config.runtime = 'typescript'
  errors = []
  config.handler = `${file}.${handler}`
  config.runtimeConfig = { baseRuntime: 'nodejs14.x', handlerFile }
  result = getHandler({ config, src, build, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${build}/${handlerFile}`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Compiled to a binary
  config = defaultFunctionConfig()
  config.runtime = 'rust'
  errors = []
  config.handler = `${file}.${handler}`
  result = getHandler({ config, src, build, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${build}/${file}`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Interpreted custom runtime, with specified handlerFile
  config = defaultFunctionConfig()
  handlerFile = 'index.php'
  config.runtime = 'php'
  errors = []
  config.handler = `${file}.${handler}`
  config.runtimeConfig = { handlerFile }
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${handlerFile}`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handler, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Interpreted custom runtime, with specified handlerMethod
  config = defaultFunctionConfig()
  handlerMethod = 'anotherHandler'
  config.runtime = 'php'
  errors = []
  config.handler = `${file}.${handler}`
  config.runtimeConfig = { handlerMethod }
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handlerMethod, `Got correct handlerMethod: ${result.handlerMethod}`)

  // Interpreted custom runtime, with specified handlerFile + handlerMethod
  config = defaultFunctionConfig()
  config.runtime = 'php'
  errors = []
  config.handler = `${file}.${handler}`
  config.runtimeConfig = { handlerFile, handlerMethod }
  result = getHandler({ config, src, errors })
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${handlerFile}`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerMethod, handlerMethod, `Got correct handlerMethod: ${result.handlerMethod}`)
})

test('@ population', t => {
  t.plan(2)
  let src = 'src/foo'
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
