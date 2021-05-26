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
  result = getHandler(config, src, errors)
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.js`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerFunction, handler, `Got correct handlerFunction: ${result.handlerFunction}`)

  // Assume Node will keep being developed and keyed by AWS starting with `nodejs`
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'nodejs16.x'
  config.handler = `${file}.${handler}`
  result = getHandler(config, src, errors)
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.js`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerFunction, handler, `Got correct handlerFunction: ${result.handlerFunction}`)

  // Python
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'python3.8'
  config.handler = `${file}.${handler}`
  result = getHandler(config, src, errors)
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.py`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerFunction, handler, `Got correct handlerFunction: ${result.handlerFunction}`)

  // Ruby
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'ruby2.7'
  config.handler = `${file}.${handler}`
  result = getHandler(config, src, errors)
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.rb`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerFunction, handler, `Got correct handlerFunction: ${result.handlerFunction}`)

  // Deno
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'deno'
  config.handler = `${file}.${handler}`
  result = getHandler(config, src, errors)
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}.ts`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerFunction, handler, `Got correct handlerFunction: ${result.handlerFunction}`)

  // Other / unknown
  config = defaultFunctionConfig()
  errors = []
  config.runtime = 'go1.x'
  config.handler = `${file}.${handler}`
  result = getHandler(config, src, errors)
  t.notOk(errors.length, 'Did not get handler errors')
  t.equal(result.handlerFile, `${src}/${file}`, `Got correct handlerFile: ${result.handlerFile}`)
  t.equal(result.handlerFunction, handler, `Got correct handlerFunction: ${result.handlerFunction}`)
})

test('@ population', t => {
  t.plan(2)
  let src = 'src/foo'
  let config
  let errors

  config = defaultFunctionConfig()
  errors = []
  config.handler = 'whatev'
  getHandler(config, src, errors)
  t.ok(errors.length, 'Got invalid handler error')

  config = defaultFunctionConfig()
  errors = []
  config.handler = 'whatev.thing.yo'
  getHandler(config, src, errors)
  t.ok(errors.length, 'Got invalid handler error')
})
