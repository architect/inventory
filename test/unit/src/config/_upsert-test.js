let parse = require('@architect/parser')
let { test } = require('node:test')
let upsert = require('../../../../src/config/_upsert')
let defaultFunctionConfig = require('../../../../src/defaults/function-config')

let defaults = defaultFunctionConfig()
let str = s => JSON.stringify(s)

let rawConfigMock = `@aws
timeout 10
memory 3008
runtime python3.7
handler index.yo
state idkwhynot
concurrency 420
storage 1337
layers
  layer-1
  layer-2
policies
  policy-1
  policy-2
architecture x86_64
`
let mock = parse(rawConfigMock)

// Reset defaults before each test
test.beforeEach(() => {
  defaults = defaultFunctionConfig()
})

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(upsert, 'Upsert module is present')
})

test('Upsert does not mutate params', t => {
  t.plan(3)
  let mockBackup = { ...mock }
  let result = upsert(defaults, mock.aws)
  t.assert.ok(result, 'Got result from upsert')
  t.assert.equal(str(defaults), str(defaultFunctionConfig()), 'Did not mutate base config')
  t.assert.equal(str(mock.aws), str(mockBackup.aws), 'Did not mutate overlaid config')
})

test('Upsert returns same number of params', t => {
  t.plan(3)
  let result = upsert(defaults, [])
  t.assert.ok(result, 'Got result from upsert')
  t.assert.equal(Object.keys(result).length, 12, 'Got back same number of params as base config')
  t.assert.equal(str(defaults), str(result), 'Passed back config as-is')
})

test('Upsert ignores invalid setting (strings)', t => {
  t.plan(2)
  let stringSetting = parse(`@aws
idk
`).aws
  let result = upsert(defaults, stringSetting)
  t.assert.ok(!defaults.idk, 'Testing property not already present in the default')
  t.assert.equal(str(defaults), str(result), 'Ignored invalid setting')
})

test('Individual setting upsert: timeout', t => {
  t.plan(2)
  let value = 10
  let { aws: timeout } = parse(`@aws
timeout ${value}
`)
  let result = upsert(defaults, timeout)
  t.assert.notEqual(defaults.timeout, value, 'Testing value is not already the default')
  t.assert.equal(result.timeout, value, 'Properly upserted timeout')
})

test('Individual setting upsert: memory', t => {
  t.plan(2)
  let value = 3008
  let { aws: memory } = parse(`@aws
memory ${value}
`)
  let result = upsert(defaults, memory)
  t.assert.notEqual(defaults.memory, value, 'Testing value is not already the default')
  t.assert.equal(result.memory, value, 'Properly upserted memory')
})

test('Individual setting upsert: runtime', t => {
  t.plan(2)
  let value = 'python3.7'
  let { aws: runtime } = parse(`@aws
runtime ${value}
`)
  let result = upsert(defaults, runtime)
  t.assert.notEqual(defaults.runtime, value, 'Testing value is not already the default')
  t.assert.equal(result.runtime, value, 'Properly upserted runtime')
})

test('Individual setting upsert: handler', t => {
  t.plan(2)
  let value = 'index.yo'
  let { aws: handler } = parse(`@aws
handler ${value}
`)
  let result = upsert(defaults, handler)
  t.assert.notEqual(defaults.handler, value, 'Testing value is not already the default')
  t.assert.equal(result.handler, value, 'Properly upserted handler')
})

test('Individual setting upsert: state', t => {
  t.plan(2)
  let value = 'idkwhynot'
  let { aws: state } = parse(`@aws
state ${value}
`)
  let result = upsert(defaults, state)
  t.assert.notEqual(defaults.state, value, 'Testing value is not already the default')
  t.assert.equal(result.state, value, 'Properly upserted state')
})

test('Individual setting upsert: concurrency', t => {
  t.plan(2)
  let value = 100
  let { aws: concurrency } = parse(`@aws
concurrency ${value}
`)
  let result = upsert(defaults, concurrency)
  t.assert.notEqual(defaults.concurrency, value, 'Testing value is not already the default')
  t.assert.equal(result.concurrency, value, 'Properly upserted concurrency')
})

test('Individual setting upsert: layers', t => {
  t.plan(28)
  let value
  let layers
  let result
  let expected
  let layersDefaults

  /**
   * layer
   */
  // Single inline
  value = [ 'layer-1' ]
  layers = parse(`@aws
layer ${value}
`).aws
  result = upsert(defaults, layers)
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted single layer')

  // Multiple inline
  value = [ 'layer-1', 'layer-2' ]
  layers = parse(`@aws
layer ${value.join(' ')}
`).aws
  result = upsert(defaults, layers)
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted layers')

  // Single in array
  value = [ 'layer-1' ]
  layers = parse(`@aws
layer
  ${value}
`).aws
  result = upsert(defaults, layers)
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted single layer')

  // Multiple in array
  value = [ 'layer-1', 'layer-2' ]
  layers = parse(`@aws
layer
  ${value.join('\n  ')}
`).aws
  result = upsert(defaults, layers)
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted layers')

  // Multiple in array de-duped
  layersDefaults = defaultFunctionConfig()
  layersDefaults.layers = [ 'layer-1', 'layer-2' ]
  value = [ 'layer-2', 'layer-3', 'layer-3' ]
  expected = [ 'layer-2', 'layer-3' ]
  layers = parse(`@aws
layer
  ${value.join('\n  ')}
`).aws
  result = upsert(layersDefaults, layers)
  t.assert.notEqual(str(layersDefaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(expected), 'Properly upserted layers & de-duped')

  /**
   * layers
   */
  // Single inline
  value = [ 'layer-1' ]
  layers = parse(`@aws
layers ${value}
`).aws
  result = upsert(defaults, layers)
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted single layer')

  // Multiple inline
  value = [ 'layer-1', 'layer-2' ]
  layers = parse(`@aws
layers ${value.join(' ')}
`).aws
  result = upsert(defaults, layers)
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted layers')

  // Single in array
  value = [ 'layer-1' ]
  layers = parse(`@aws
layers
  ${value}
`).aws
  result = upsert(defaults, layers)
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted single layer')

  // Multiple in array
  value = [ 'layer-1', 'layer-2' ]
  layers = parse(`@aws
layers
  ${value.join('\n  ')}
`).aws
  result = upsert(defaults, layers)
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted layers')

  // Multiple in array de-duped
  layersDefaults = defaultFunctionConfig()
  layersDefaults.layers = [ 'layer-1', 'layer-2' ]
  value = [ 'layer-2', 'layer-3', 'layer-3' ]
  expected = [ 'layer-2', 'layer-3' ]
  layers = parse(`@aws
layers
  ${value.join('\n  ')}
`).aws
  result = upsert(layersDefaults, layers)
  t.assert.notEqual(str(layersDefaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(expected), 'Properly upserted layers & de-duped')

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
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted layers & de-duped')

  /**
   * layer + layers if you're a total weirdo
   */
  value = [ 'layer-1', 'layer-2' ]
  layers = parse(`@aws
layer ${value[0]}
layers ${value[1]}
`).aws
  result = upsert(defaults, layers)
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted single layer')

  layers = parse(`@aws
layer
  ${value[0]}
layers
  ${value[1]}
`).aws
  result = upsert(defaults, layers)
  t.assert.notEqual(str(defaults.layers), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.layers), str(value), 'Properly upserted single layer')

  /**
   * Don't unnecessarily overwrite existing layers config
   */
  layersDefaults = defaultFunctionConfig()
  layersDefaults.layers = [ 'layer-1', 'layer-2' ]
  layers = parse(`@aws
runtime python
`).aws
  result = upsert(layersDefaults, layers)
  t.assert.notEqual(str(layersDefaults.layers), str(layers.layers), 'Testing value is not already the default')
  t.assert.equal(str(layersDefaults.layers), str(result.layers), 'Did not overwrite project-level config with empty layers array')
})

test('Individual setting upsert: policies', t => {
  t.plan(28)
  let value
  let policies
  let result
  let expected
  let policiesDefaults

  /**
   * policy
   */
  // Single inline
  value = [ 'policy-1' ]
  policies = parse(`@aws
policy ${value}
`).aws
  result = upsert(defaults, policies)
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted single policy')

  // Multiple inline
  value = [ 'policy-1', 'policy-2' ]
  policies = parse(`@aws
policy ${value.join(' ')}
`).aws
  result = upsert(defaults, policies)
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted policies')

  // Single in array
  value = [ 'policy-1' ]
  policies = parse(`@aws
policy
  ${value}
`).aws
  result = upsert(defaults, policies)
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted single policy')

  // Multiple in array
  value = [ 'policy-1', 'policy-2' ]
  policies = parse(`@aws
policy
  ${value.join('\n  ')}
`).aws
  result = upsert(defaults, policies)
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted policies')

  // Multiple in array de-duped
  policiesDefaults = defaultFunctionConfig()
  policiesDefaults.policies = [ 'policy-1', 'policy-2' ]
  value = [ 'policy-2', 'policy-3', 'policy-3' ]
  expected = [ 'policy-2', 'policy-3' ]
  policies = parse(`@aws
policy
  ${value.join('\n  ')}
`).aws
  result = upsert(policiesDefaults, policies)
  t.assert.notEqual(str(policiesDefaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(expected), 'Properly upserted policies & de-duped')

  /**
   * policies
   */
  // Single inline
  value = [ 'policy-1' ]
  policies = parse(`@aws
policies ${value}
`).aws
  result = upsert(defaults, policies)
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted single policy')

  // Multiple inline
  value = [ 'policy-1', 'policy-2' ]
  policies = parse(`@aws
policies ${value.join(' ')}
`).aws
  result = upsert(defaults, policies)
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted single policy')

  // Single in array
  value = [ 'policy-1' ]
  policies = parse(`@aws
policies
  ${value}
`).aws
  result = upsert(defaults, policies)
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted single policy')

  // Multiple in array
  value = [ 'policy-1', 'policy-2' ]
  policies = parse(`@aws
  policies
    ${value.join('\n  ')}
  `).aws
  result = upsert(defaults, policies)
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted single policy')

  // Multiple in array de-duped
  policiesDefaults = defaultFunctionConfig()
  policiesDefaults.policies = [ 'policy-1', 'policy-2' ]
  value = [ 'policy-2', 'policy-3', 'policy-3' ]
  expected = [ 'policy-2', 'policy-3' ]
  policies = parse(`@aws
policies
  ${value.join('\n  ')}
`).aws
  result = upsert(policiesDefaults, policies)
  t.assert.notEqual(str(policiesDefaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(expected), 'Properly upserted policies & de-duped')

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
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted policies & de-duped')

  /**
   * policy + policies if you're a total weirdo
   */
  value = [ 'policy-1', 'policy-2' ]
  policies = parse(`@aws
policy ${value[0]}
policies ${value[1]}
`).aws
  result = upsert(defaults, policies)
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted single policy')

  policies = parse(`@aws
policy
  ${value[0]}
policies
  ${value[1]}
`).aws
  result = upsert(defaults, policies)
  t.assert.notEqual(str(defaults.policies), str(value), 'Testing value is not already the default')
  t.assert.equal(str(result.policies), str(value), 'Properly upserted single policy')

  /**
   * Don't unnecessarily overwrite existing policies config
   */
  policiesDefaults = defaultFunctionConfig()
  policiesDefaults.policies = [ 'policy-1', 'policy-2' ]
  policies = parse(`@aws
runtime python
`).aws
  result = upsert(policiesDefaults, policies)
  t.assert.notEqual(str(policiesDefaults.policies), str(policies.policies), 'Testing value is not already the default')
  t.assert.equal(str(policiesDefaults.policies), str(result.policies), 'Did not overwrite project-level config with empty policies array')
})

test('Individual setting upsert: something unknown', t => {
  t.plan(6)
  let result, value

  value = 'mysterious'
  let { aws: idk } = parse(`@aws
idk ${value}
`)
  result = upsert(defaults, idk)
  t.assert.ok(!defaults.idk, 'Testing property not already present in the default')
  t.assert.equal(result.idk, value, 'Properly upserted unknown setting')

  value = [ 'foo', 'bar' ]
  let { aws: arr } = parse(`@aws
arr
  ${value[0]}
  ${value[1]}
`)
  result = upsert(defaults, arr)
  t.assert.ok(!defaults.arr, 'Testing property not already present in the default')
  t.assert.deepEqual(result.arr, value, 'Properly upserted unknown array setting')

  let { aws: inlineArr } = parse(`@aws
arr ${value[0]} ${value[1]}
`)
  result = upsert(defaults, inlineArr)
  t.assert.ok(!defaults.arr, 'Testing property not already present in the default')
  t.assert.deepEqual(result.arr, value, 'Properly upserted unknown inline array setting')
})
