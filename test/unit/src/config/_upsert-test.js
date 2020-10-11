let parse = require('@architect/parser')
let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', '_upsert')
let upsert = require(sut)
let defaultFunctionConfig = require(join(process.cwd(), 'src', 'defaults', 'function-config'))

let defaults = defaultFunctionConfig()
let str = s => JSON.stringify(s)

let rawConfigMock = `@aws
timeout 10
memory 3008
runtime python3.7
handler index.yo
state idkwhynot
concurrency 1337
layers
  layer-1
  layer-2
policies
  policy-1
  policy-2
`
let mock = parse(rawConfigMock)

test('Set up env', t => {
  t.plan(1)
  t.ok(upsert, 'Upsert module is present')
})

test('Upsert does not mutate params', t => {
  t.plan(3)
  let mockBackup = { ...mock }
  let result = upsert(defaults, mock.aws)
  t.ok(result, 'Got result from upsert')
  t.equal(str(defaults), str(defaultFunctionConfig()), 'Did not mutate base config')
  t.equal(str(mock.aws), str(mockBackup.aws), 'Did not mutate overlaid config')
})

test('Upsert returns same number of params', t => {
  t.plan(3)
  let result = upsert(defaults, [])
  t.ok(result, 'Got result from upsert')
  t.equal(Object.keys(result).length, 10, 'Got back same number of params as base config')
  t.equal(str(defaults), str(result), 'Passed back config as-is')
})

test('Upsert ignores invalid setting (strings)', t => {
  t.plan(2)
  let stringSetting = parse(`@aws
idk
`).aws
  let result = upsert(defaults, stringSetting)
  t.notOk(defaults.idk, 'Testing property not already present in the default')
  t.equal(str(defaults), str(result), 'Ignored invalid setting')
})

test('Individual setting upsert: timeout', t => {
  t.plan(2)
  let value = 10
  let { aws: timeout } = parse(`@aws
timeout ${value}
`)
  let result = upsert(defaults, timeout)
  t.notEqual(defaults.timeout, value, 'Testing value is not already the default')
  t.equal(result.timeout, value, 'Properly upserted timeout')
})

test('Individual setting upsert: memory', t => {
  t.plan(2)
  let value = 3008
  let { aws: memory } = parse(`@aws
memory ${value}
`)
  let result = upsert(defaults, memory)
  t.notEqual(defaults.memory, value, 'Testing value is not already the default')
  t.equal(result.memory, value, 'Properly upserted memory')
})

test('Individual setting upsert: runtime', t => {
  t.plan(2)
  let value = 'python3.7'
  let { aws: runtime } = parse(`@aws
runtime ${value}
`)
  let result = upsert(defaults, runtime)
  t.notEqual(defaults.runtime, value, 'Testing value is not already the default')
  t.equal(result.runtime, value, 'Properly upserted runtime')
})

test('Individual setting upsert: handler', t => {
  t.plan(2)
  let value = 'index.yo'
  let { aws: handler } = parse(`@aws
handler ${value}
`)
  let result = upsert(defaults, handler)
  t.notEqual(defaults.handler, value, 'Testing value is not already the default')
  t.equal(result.handler, value, 'Properly upserted handler')
})

test('Individual setting upsert: state', t => {
  t.plan(2)
  let value = 'idkwhynot'
  let { aws: state } = parse(`@aws
state ${value}
`)
  let result = upsert(defaults, state)
  t.notEqual(defaults.state, value, 'Testing value is not already the default')
  t.equal(result.state, value, 'Properly upserted state')
})

test('Individual setting upsert: concurrency', t => {
  t.plan(2)
  let value = 100
  let { aws: concurrency } = parse(`@aws
concurrency ${value}
`)
  let result = upsert(defaults, concurrency)
  t.notEqual(defaults.concurrency, value, 'Testing value is not already the default')
  t.equal(result.concurrency, value, 'Properly upserted concurrency')
})

test('Individual setting upsert: layers', t => {
  t.plan(20)
  let value
  let layers
  let result
  let expected
  let layersDefaults

  /**
   * layer
   */
  value = [ 'layer-1' ]
  layers = parse(`@aws
layer ${value}
`).aws
  result = upsert(defaults, layers)
  t.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.equal(str(result.layers), str(value), 'Properly upserted single layer')

  value = [ 'layer-1' ]
  layers = parse(`@aws
layer
  ${value}
`).aws
  result = upsert(defaults, layers)
  t.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.equal(str(result.layers), str(value), 'Properly upserted single layer')

  layersDefaults = defaultFunctionConfig()
  layersDefaults.layers = [ 'layer-1', 'layer-2' ]
  value = [ 'layer-2', 'layer-3', 'layer-3' ]
  expected = [ 'layer-2', 'layer-3' ]
  layers = parse(`@aws
layer
  ${value.join('\n  ')}
`).aws
  result = upsert(layersDefaults, layers)
  t.notEqual(str(layersDefaults.layers), str(value), 'Testing value is not already the default')
  t.equal(str(result.layers), str(expected), 'Properly upserted layers & de-duped')

  /**
   * layers
   */
  value = [ 'layer-1' ]
  layers = parse(`@aws
layers ${value}
`).aws
  result = upsert(defaults, layers)
  t.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.equal(str(result.layers), str(value), 'Properly upserted single layer')

  value = [ 'layer-1' ]
  layers = parse(`@aws
layers
  ${value}
`).aws
  result = upsert(defaults, layers)
  t.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.equal(str(result.layers), str(value), 'Properly upserted single layer')

  layersDefaults = defaultFunctionConfig()
  layersDefaults.layers = [ 'layer-1', 'layer-2' ]
  value = [ 'layer-2', 'layer-3', 'layer-3' ]
  expected = [ 'layer-2', 'layer-3' ]
  layers = parse(`@aws
layers
  ${value.join('\n  ')}
`).aws
  result = upsert(layersDefaults, layers)
  t.notEqual(str(layersDefaults.layers), str(value), 'Testing value is not already the default')
  t.equal(str(result.layers), str(expected), 'Properly upserted layers & de-duped')

  /**
   * layer multiple times
   */
  value = [ 'layer-1', 'layer-2' ]
  layers = parse(`@aws
layer ${value[0]}
layer ${value[1]}
layer ${value[1]}
`).aws
  result = upsert(defaults, layers)
  t.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.equal(str(result.layers), str(value), 'Properly upserted layers & de-duped')

  /**
   * layer + layers if you're a total weirdo
   */
  value = [ 'layer-1', 'layer-2' ]
  layers = parse(`@aws
layer ${value[0]}
layers ${value[1]}
`).aws
  result = upsert(defaults, layers)
  t.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.equal(str(result.layers), str(value), 'Properly upserted single layer')

  layers = parse(`@aws
layer
  ${value[0]}
layers
  ${value[1]}
`).aws
  result = upsert(defaults, layers)
  t.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.equal(str(result.layers), str(value), 'Properly upserted single layer')

  /**
   * Don't unnecessarily overwrite existing layers config
   */
  layersDefaults = defaultFunctionConfig()
  layersDefaults.layers = [ 'layer-1', 'layer-2' ]
  layers = parse(`@aws
runtime 10
`).aws
  result = upsert(layersDefaults, layers)
  t.notEqual(str(layersDefaults.layers), str(layers.layers), 'Testing value is not already the default')
  t.equal(str(layersDefaults.layers), str(result.layers), 'Did not overwrite project-level config with empty layers array')
})

test('Individual setting upsert: policies', t => {
  t.plan(20)
  let value
  let policies
  let result
  let expected
  let policiesDefaults

  /**
   * policy
   */
  value = [ 'policy-1' ]
  policies = parse(`@aws
policy ${value}
`).aws
  result = upsert(defaults, policies)
  t.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.equal(str(result.policies), str(value), 'Properly upserted single policy')

  value = [ 'policy-1' ]
  policies = parse(`@aws
policy
  ${value}
`).aws
  result = upsert(defaults, policies)
  t.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.equal(str(result.policies), str(value), 'Properly upserted single policy')

  policiesDefaults = defaultFunctionConfig()
  policiesDefaults.policies = [ 'policy-1', 'policy-2' ]
  value = [ 'policy-2', 'policy-3', 'policy-3' ]
  expected = [ 'policy-2', 'policy-3' ]
  policies = parse(`@aws
policy
  ${value.join('\n  ')}
`).aws
  result = upsert(policiesDefaults, policies)
  t.notEqual(str(policiesDefaults.policies), str(value), 'Testing value is not already the default')
  t.equal(str(result.policies), str(expected), 'Properly upserted policies & de-duped')

  /**
   * policies
   */
  value = [ 'policy-1' ]
  policies = parse(`@aws
policies ${value}
`).aws
  result = upsert(defaults, policies)
  t.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.equal(str(result.policies), str(value), 'Properly upserted single policy')

  value = [ 'policy-1' ]
  policies = parse(`@aws
policies
  ${value}
`).aws
  result = upsert(defaults, policies)
  t.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.equal(str(result.policies), str(value), 'Properly upserted single policy')

  policiesDefaults = defaultFunctionConfig()
  policiesDefaults.policies = [ 'policy-1', 'policy-2' ]
  value = [ 'policy-2', 'policy-3', 'policy-3' ]
  expected = [ 'policy-2', 'policy-3' ]
  policies = parse(`@aws
policies
  ${value.join('\n  ')}
`).aws
  result = upsert(policiesDefaults, policies)
  t.notEqual(str(policiesDefaults.policies), str(value), 'Testing value is not already the default')
  t.equal(str(result.policies), str(expected), 'Properly upserted policies & de-duped')

  /**
   * policy multiple times
   */
  value = [ 'policy-1', 'policy-2' ]
  policies = parse(`@aws
policy ${value[0]}
policy ${value[1]}
policy ${value[1]}
`).aws
  result = upsert(defaults, policies)
  t.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.equal(str(result.policies), str(value), 'Properly upserted policies & de-duped')

  /**
   * policy + policies if you're a total weirdo
   */
  value = [ 'policy-1', 'policy-2' ]
  policies = parse(`@aws
policy ${value[0]}
policies ${value[1]}
`).aws
  result = upsert(defaults, policies)
  t.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.equal(str(result.policies), str(value), 'Properly upserted single policy')

  policies = parse(`@aws
policy
  ${value[0]}
policies
  ${value[1]}
`).aws
  result = upsert(defaults, policies)
  t.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.equal(str(result.policies), str(value), 'Properly upserted single policy')

  /**
   * Don't unnecessarily overwrite existing policies config
   */
  policiesDefaults = defaultFunctionConfig()
  policiesDefaults.policies = [ 'policy-1', 'policy-2' ]
  policies = parse(`@aws
runtime 10
`).aws
  result = upsert(policiesDefaults, policies)
  t.notEqual(str(policiesDefaults.policies), str(policies.policies), 'Testing value is not already the default')
  t.equal(str(policiesDefaults.policies), str(result.policies), 'Did not overwrite project-level config with empty policies array')
})

test('Individual setting upsert: something unknown', t => {
  t.plan(2)
  let value = 'mysterious'
  let { aws: idk } = parse(`@aws
idk ${value}
`)
  let result = upsert(defaults, idk)
  t.notOk(defaults.idk, 'Testing property not already present in the default')
  t.equal(result.idk, value, 'Properly upserted unknown setting')
})
