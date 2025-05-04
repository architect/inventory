let { test } = require('node:test')
let getRuntimes = require('../../../../../../src/config/pragmas/populate-lambda/get-runtime')
let c = runtime => ({ runtime })
let inventory = { _project: {} }

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(getRuntimes, 'getRuntimes util is present')
})

test('Friendly runtime names (aka aliases)', t => {
  t.plan(12)
  let config

  config = getRuntimes({ config: c('Node.js'), inventory })
  t.assert.match(config.runtime, /nodejs2[02468]\.x/, `Alias mapped to valid AWS Node.js string: ${config.runtime}`)
  t.assert.equal(config.runtimeAlias, 'node.js', `Alias returned lowcase as runtimeAlias: ${config.runtimeAlias}`)

  config = getRuntimes({ config: c('Python'), inventory })
  t.assert.match(config.runtime, /python3\.\d/, `Alias mapped to valid AWS Python string: ${config.runtime}`)
  t.assert.equal(config.runtimeAlias, 'python', `Alias returned lowcase as runtimeAlias: ${config.runtimeAlias}`)

  config = getRuntimes({ config: c('ruby'), inventory })
  t.assert.match(config.runtime, /ruby3\.\d/, `Alias mapped to valid AWS Ruby string: ${config.runtime}`)
  t.assert.equal(config.runtimeAlias, 'ruby', `Alias returned lowcase as runtimeAlias: ${config.runtimeAlias}`)

  config = getRuntimes({ config: c('java'), inventory })
  t.assert.match(config.runtime, /java\d/, `Alias mapped to valid AWS Java string: ${config.runtime}`)
  t.assert.equal(config.runtimeAlias, 'java', `Alias returned lowcase as runtimeAlias: ${config.runtimeAlias}`)

  config = getRuntimes({ config: c('.net'), inventory })
  t.assert.match(config.runtime, /dotnet8/, `Alias mapped to valid AWS .NET string: ${config.runtime}`)
  t.assert.equal(config.runtimeAlias, '.net', `Alias returned lowcase as runtimeAlias: ${config.runtimeAlias}`)

  config = getRuntimes({ config: c('custom'), inventory })
  t.assert.match(config.runtime, /provided/, `Alias mapped to valid AWS custom runtime string: ${config.runtime}`)
  t.assert.equal(config.runtimeAlias, 'custom', `Alias returned lowcase as runtimeAlias: ${config.runtimeAlias}`)
})

test('Exact runtime names', t => {
  t.plan(14)
  let name
  let config

  name = 'nodejs18.x'
  config = getRuntimes({ config: c(name), inventory })
  t.assert.equal(config.runtime, name, `Returned correct runtime string: ${name}`)
  t.assert.ok(!config.runtimeAlias, 'Did not get runtimeAlias')

  name = 'python3.11'
  config = getRuntimes({ config: c(name), inventory })
  t.assert.equal(config.runtime, name, `Returned correct runtime string: ${name}`)
  t.assert.ok(!config.runtimeAlias, 'Did not get runtimeAlias')

  name = 'ruby3.2'
  config = getRuntimes({ config: c(name), inventory })
  t.assert.equal(config.runtime, name, `Returned correct runtime string: ${name}`)
  t.assert.ok(!config.runtimeAlias, 'Did not get runtimeAlias')

  name = 'java17'
  config = getRuntimes({ config: c(name), inventory })
  t.assert.equal(config.runtime, name, `Returned correct runtime string: ${name}`)
  t.assert.ok(!config.runtimeAlias, 'Did not get runtimeAlias')

  name = 'dotnet8'
  config = getRuntimes({ config: c(name), inventory })
  t.assert.equal(config.runtime, name, `Returned correct runtime string: ${name}`)
  t.assert.ok(!config.runtimeAlias, 'Did not get runtimeAlias')

  name = 'provided.al2'
  config = getRuntimes({ config: c(name), inventory })
  t.assert.equal(config.runtime, name, `Returned correct runtime string: ${name}`)
  t.assert.ok(!config.runtimeAlias, 'Did not get runtimeAlias')

  name = 'deno'
  config = getRuntimes({ config: c(name), inventory })
  t.assert.equal(config.runtime, name, `Returned correct runtime string: ${name}`)
  t.assert.ok(!config.runtimeAlias, 'Did not get runtimeAlias')
})

test('Custom runtime via plugin', t => {
  t.plan(8)
  let name = 'rust'
  let config
  let runtimeConfig
  let inventory

  runtimeConfig = {
    additionalProperty: 'idk',
  }
  inventory = { _project: { customRuntimes: { [name]: runtimeConfig } } }

  config = getRuntimes({ config: c(name), inventory })
  t.assert.equal(config.runtime, name, `Returned correct runtime string: ${name}`)
  t.assert.ok(!config.runtimeAlias, 'Did not get runtimeAlias')
  t.assert.ok(!config.build, 'Did not get build')
  t.assert.deepEqual(config.runtimeConfig, runtimeConfig, 'Custom runtime config found within Lambda config')

  let build = '.some-build-dir'
  runtimeConfig.build = build
  inventory = { _project: { customRuntimes: { [name]: runtimeConfig } } }

  config = getRuntimes({ config: c(name), inventory })
  t.assert.equal(config.runtime, name, `Returned correct runtime string: ${name}`)
  t.assert.ok(!config.runtimeAlias, 'Did not get runtimeAlias')
  t.assert.deepEqual(config.runtimeConfig, runtimeConfig, 'Custom runtime config found within Lambda config')
  t.assert.equal(config.runtimeConfig.build, build, 'Got build property')
})

test('Invalid runtime', t => {
  t.plan(5)
  let config

  let empty = {}
  config = getRuntimes({ config: empty, inventory })
  t.assert.ok(!Object.keys(config).length, 'Did not mutate config without runtime')

  let num = { runtime: 1 }
  config = getRuntimes({ config: num, inventory })
  t.assert.deepEqual(config, num, 'Did not mutate config with !string runtime')

  let blank = { runtime: '' }
  config = getRuntimes({ config: blank, inventory })
  t.assert.deepEqual(config, blank, 'Did not mutate config with empty string runtime')

  let invalid = { runtime: 'fail' }
  config = getRuntimes({ config: invalid, inventory })
  t.assert.deepEqual(config, invalid, 'Did not mutate config with bad runtime')
  t.assert.ok(!config.runtimeAlias, 'Did not get runtimeAlias')
})
