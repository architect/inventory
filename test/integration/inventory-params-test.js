let { join } = require('path')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'index')
let inv = require(sut)

let dir = process.cwd()
let defaults = inventoryDefaults()
let mock = join(process.cwd(), 'test', 'mock')
let invAndGet = 1 + 1
function reset () {
  process.chdir(dir)
}

test('Set up env', t => {
  t.plan(1)
  t.ok(inv, 'Inventory entry is present')
})

test('Inventory an empty project', t => {
  let keys = Object.keys(defaults)
  t.plan((keys.length * 2) + invAndGet)
  let cwd = join(mock, 'empty')
  inv({ cwd }, (err, result) => {
    if (err) t.fail(err)
    else {
      let { inv, get } = result
      t.ok(inv, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      keys.forEach(key => {
        let invFound = inv[key] || inv[key] === null
        let getFound = get[key]
        t.ok(invFound, `Inventory has entry for: ${key}`)
        t.ok(getFound, `Getter has entry for: ${key}`)
      })
      reset()
    }
  })
})

test('Inventory a maxed-out project', t => {
  let keys = Object.keys(defaults)
  t.plan((keys.length * 2) + invAndGet)
  let cwd = join(mock, 'max')
  inv({ cwd }, (err, result) => {
    if (err) t.fail(err)
    else {
      let { inv, get } = result
      t.ok(inv, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      keys.forEach(key => {
        let invFound = inv[key]
        let getFound = get[key]
        if (key === 'customLambdas') {
          t.notOk(invFound, `Inventory has no entry for: ${key}`)
        }
        else {
          t.ok(invFound, `Inventory has entry for: ${key}`)
        }
        t.ok(getFound, `Getter has entry for: ${key}`)
      })
      reset()
    }
  })
})

test('Inventory a project with a plugin that registers lambdas', t => {
  t.plan(19)
  let cjs = 'pubsub-cjs'
  let esm = 'pubsub-esm'
  let cjsPragma = 'custom-' + cjs
  let esmPragma = 'custom-' + esm

  let cwd = join(mock, 'plugins-lambda')
  let channelOneDir = join(cwd, 'src', cjs, 'channel-one')
  let channelTwoDir = join(cwd, 'src', cjs, 'channel-two')
  let channelThreeDir = join(cwd, 'src', esm, 'channel-three')
  let channelFourDir = join(cwd, 'src', esm, 'channel-four')
  inv({ cwd }, (err, result) => {
    if (err) t.fail(err)
    else {
      let { inv } = result
      t.ok(inv.plugins[cjsPragma], 'CJS plugin registered')
      t.ok(inv.plugins[esmPragma], 'ESM setter plugin registered')
      t.ok(inv.plugins.rando, 'ESM sandbox plugin registered')
      t.equals(typeof inv.plugins[cjsPragma], 'object', 'custom plugin module pulled into inventory')
      t.equals(typeof inv.plugins[esmPragma], 'object', 'custom plugin module pulled into inventory')
      t.equals(typeof inv.plugins.rando, 'object', 'custom plugin module pulled into inventory')
      t.equal(inv['customLambdas'].length, 4, `inv['customLambdas'] contains two plugin custom lambdae`)
      t.equal(inv['customLambdas'][0].src, channelOneDir, `inv['customLambdas'] contains first of four plugin custom lambdae`)
      t.equal(inv['customLambdas'][1].src, channelTwoDir, `inv['customLambdas'] contains second of four plugin custom lambdae`)
      t.equal(inv['customLambdas'][2].src, channelThreeDir, `inv['customLambdas'] contains third of four plugin custom lambdae`)
      t.equal(inv['customLambdas'][3].src, channelFourDir, `inv['customLambdas'] contains fourth of four plugin custom lambdae`)
      t.ok(inv.lambdaSrcDirs.includes(channelOneDir), 'lambdaSrcDirs contains first of four plugin custom lambdae')
      t.ok(inv.lambdaSrcDirs.includes(channelTwoDir), 'lambdaSrcDirs contains second of four plugin custom lambdae')
      t.ok(inv.lambdaSrcDirs.includes(channelThreeDir), 'lambdaSrcDirs contains third of four plugin custom lambdae')
      t.ok(inv.lambdaSrcDirs.includes(channelFourDir), 'lambdaSrcDirs contains fourth of four plugin custom lambdae')
      t.ok(inv.lambdasBySrcDir[channelOneDir], 'lambdasBySrcDir contains first of four plugin custom lambdae')
      t.ok(inv.lambdasBySrcDir[channelTwoDir], 'lambdasBySrcDir contains second of four plugin custom lambdae')
      t.ok(inv.lambdasBySrcDir[channelThreeDir], 'lambdasBySrcDir contains third of four plugin custom lambdae')
      t.ok(inv.lambdasBySrcDir[channelFourDir], 'lambdasBySrcDir contains fourth of four plugin custom lambdae')
      reset()
    }
  })
})
