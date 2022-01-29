let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'project', 'plugins', 'env')
let setEnvPlugins = require(sut)

let nulls = {
  testing: null,
  staging: null,
  production: null,
}
let noEnv = {
  local: nulls,
  plugins: nulls,
  aws: nulls,
}
let newInv = (env = { plugins: null }) => {
  return {
    _project: { env: noEnv },
    plugins: { _methods: { set: { env } } },
  }
}

let varStr = { str: 'bar' }
let varNum = { num: 123 }
let varFloat = { float: 1.23 }
let varBool = { bool: true }
let varObj = { obj: { hi: 'there' } }
let varArr = { arr: [ 'hi', 'there' ] }
let varMany = { ...varStr, ...varNum, ...varBool }

test('Set up env', t => {
  t.plan(1)
  t.ok(setEnvPlugins, 'Env plugin setter module is present')
})

test('Do nothing if no env setter plugins are present', t => {
  t.plan(2)
  let errors = []
  let inventory = newInv()
  let plugins = setEnvPlugins({ inventory, errors }, noEnv)
  t.deepEqual(plugins, nulls, 'Plugins remain null')
  t.notOk(errors.length, 'Did not return errors')
})

test('Env setter plugin runs', t => {
  t.plan(34)
  let errors, inventory, plugins, pluginOne, pluginTwo

  // Stringify env obj values
  let str = obj => Object.fromEntries(Object.entries(obj).map(([ k, v ]) => [ k, `${v}` ]))

  function check (actual, expected) {
    console.log(`Got env:`, actual)
    t.deepEqual(actual.testing, expected, 'Testing env got correct env vars')
    t.deepEqual(actual.staging, expected, 'Staging env got correct env vars')
    t.deepEqual(actual.production, expected, 'Production env got correct env vars')
  }

  // Plugin gets the args and props it expects
  errors = []
  pluginOne = function (params) {
    t.ok(params, 'Plugin function called and received params with Inventory')
    t.deepEqual(params, { inventory: { inv: inventory } }, 'Inventory is partial, containing the current default inventory + partially built project')
    return varStr
  }
  inventory = newInv([ pluginOne ])
  plugins = setEnvPlugins({ inventory, errors }, { env: noEnv })

  // String
  errors = []
  pluginOne = () => varStr
  inventory = newInv([ pluginOne ])
  plugins = setEnvPlugins({ inventory, errors })
  t.notOk(errors.length, 'Did not return errors')
  check(plugins, varStr)

  // String
  errors = []
  pluginOne = () => varNum
  inventory = newInv([ pluginOne ])
  plugins = setEnvPlugins({ inventory, errors })
  t.notOk(errors.length, 'Did not return errors')
  check(plugins, str(varNum))

  // Float
  errors = []
  pluginOne = () => varFloat
  inventory = newInv([ pluginOne ])
  plugins = setEnvPlugins({ inventory, errors })
  t.notOk(errors.length, 'Did not return errors')
  check(plugins, str(varFloat))

  // Bool
  errors = []
  pluginOne = () => varBool
  inventory = newInv([ pluginOne ])
  plugins = setEnvPlugins({ inventory, errors })
  t.notOk(errors.length, 'Did not return errors')
  check(plugins, str(varBool))

  // Object
  errors = []
  pluginOne = () => varObj
  inventory = newInv([ pluginOne ])
  plugins = setEnvPlugins({ inventory, errors })
  t.notOk(errors.length, 'Did not return errors')
  check(plugins, { obj: JSON.stringify(varObj.obj) })

  // Array
  errors = []
  pluginOne = () => varArr
  inventory = newInv([ pluginOne ])
  plugins = setEnvPlugins({ inventory, errors })
  t.notOk(errors.length, 'Did not return errors')
  check(plugins, { arr: JSON.stringify(varArr.arr) })

  // Multiple env vars
  errors = []
  pluginOne = () => varMany
  inventory = newInv([ pluginOne ])
  plugins = setEnvPlugins({ inventory, errors })
  t.notOk(errors.length, 'Did not return errors')
  check(plugins, str(varMany))

  // Multiple plugins
  errors = []
  pluginOne = () => varStr
  pluginTwo = () => varBool
  inventory = newInv([ pluginOne, pluginTwo ])
  plugins = setEnvPlugins({ inventory, errors })
  t.notOk(errors.length, 'Did not return errors')
  check(plugins, str({ ...varStr, ...varBool }))
})

test('Env setter plugin errors', t => {
  t.plan(14)
  let errors, inventory, pluginOne, pluginTwo

  // No return
  errors = []
  pluginOne = () => {}
  inventory = newInv([ pluginOne ])
  setEnvPlugins({ inventory, errors })
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /must return an Object/, 'Got correct error')

  // Return an invalid env var
  errors = []
  pluginOne = () => ({ 'hello!': 'there' })
  inventory = newInv([ pluginOne ])
  setEnvPlugins({ inventory, errors })
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /is invalid, must be/, 'Got correct error')

  // Throw
  errors = []
  pluginOne = () => {
    throw Error('lolidk')
  }
  inventory = newInv([ pluginOne ])
  setEnvPlugins({ inventory, errors })
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /lolidk/, 'Got correct error')

  // Return a promise, idk this is weird eh
  errors = []
  pluginOne = () => new Promise()
  inventory = newInv([ pluginOne ])
  setEnvPlugins({ inventory, errors })
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /Runtime plugin/, 'Got correct error')

  // Empty object
  errors = []
  pluginOne = () => ({})
  inventory = newInv([ pluginOne ])
  setEnvPlugins({ inventory, errors })
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /must return an Object/, 'Got correct error')

  // Multiple plugins
  errors = []
  pluginOne = () => varStr
  pluginTwo = () => varStr
  inventory = newInv([ pluginOne, pluginTwo ])
  setEnvPlugins({ inventory, errors })
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /already registered/, 'Got correct error')

  // Return a function
  errors = []
  pluginOne = () => function foo () {}
  inventory = newInv([ pluginOne ])
  setEnvPlugins({ inventory, errors })
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /must return an Object/, 'Got correct error')
})
