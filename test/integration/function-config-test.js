let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'index')
let inv = require(sut)

let dir = process.cwd()
let mock = join(process.cwd(), 'test', 'mock')
function reset () {
  process.chdir(dir)
}

test('Set up env', t => {
  t.plan(1)
  t.ok(inv, 'Inventory entry is present')
})

test('[No global runtime] Inventory and compare functions with / without function config', t => {
  t.plan(2)
  let cwd = join(mock, 'function-config', 'no-global')
  let str = str => JSON.stringify(str)
  inv({ cwd }, (err, result) => {
    if (err) t.fail(err)
    else {
      let { inv, get } = result
      t.ok(inv, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      let def = inv._project.defaultFunctionConfig
      let custom = {
        runtime: 'nodejs14.x',
        runtimeAlias: 'node',
        architecture: 'arm64',
        timeout: 10,
        memory: 128,
        storage: 1337,
        layers: [ 'arn:a:b:us-west-1:c:d:e:f' ],
        policies: [ 'arn:b:c:us-west-1:d:e:f:g' ],
        shared: false,
        env: false,
        views: false,
      }
      let params = Object.keys(custom).length
      test('Configured route uses correct custom settings', t => {
        t.plan(params)
        let { config } = get.http('get /config')
        Object.keys(custom).forEach(p => {
          t.equal(str(config[p]), str(custom[p]), `get /config has correct custom ${p} setting: ${str(config[p])}`)
        })
      })
      test('Non-configured route uses default function settings', t => {
        t.plan(params)
        let { config } = get.http('get /default')
        Object.keys(custom).forEach(p => {
          let setting = p === 'views' ? str(true) : str(def[p])
          t.equal(str(config[p]), setting, `get /default has correct default ${p} setting: ${str(config[p])}`)
        })
      })
      reset()
    }
  })
})

test('[Global runtime alias] Inventory and compare functions with / without function config', t => {
  t.plan(2)
  let cwd = join(mock, 'function-config', 'global-alias')
  let str = str => JSON.stringify(str)
  inv({ cwd }, (err, result) => {
    if (err) t.fail(err)
    else {
      let { inv, get } = result
      t.ok(inv, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      let def = inv._project.defaultFunctionConfig
      let custom = {
        runtime: 'nodejs12.x',
        runtimeAlias: undefined,
        architecture: 'arm64',
        timeout: 10,
        memory: 128,
        storage: 1337,
        layers: [ 'arn:a:b:us-west-1:c:d:e:f' ],
        policies: [ 'arn:b:c:us-west-1:d:e:f:g' ],
        shared: false,
        env: false,
        views: false,
      }
      let params = Object.keys(custom).length
      test('Configured route uses correct custom settings', t => {
        t.plan(params)
        let { config } = get.http('get /config')
        Object.keys(custom).forEach(p => {
          t.equal(str(config[p]), str(custom[p]), `get /config has correct custom ${p} setting: ${str(config[p])}`)
        })
      })
      test('Non-configured route uses default function settings with interpolated runtime', t => {
        t.plan(params)
        let { config } = get.http('get /default')
        Object.keys(custom).forEach(p => {
          let setting
          if (p === 'views') setting = str(true)
          else if (p === 'runtime') setting = str('python3.9')
          else if (p === 'runtimeAlias') setting = str('py')
          else setting = str(def[p])
          t.equal(str(config[p]), setting, `get /default has correct default ${p} setting: ${str(config[p])}`)
        })
      })
      reset()
    }
  })
})
