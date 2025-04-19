let { join } = require('node:path')
let { test } = require('node:test')
let inventoryDefaults = require('../../src/defaults')
let inventory = require('../../')

let dir = process.cwd()
let defaults = inventoryDefaults()
let mock = join(process.cwd(), 'test', 'mock')
function reset () {
  process.chdir(dir)
}

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(inventory, 'Inventory entry is present')
})

test('Inventory an empty project', async t => {
  let keys = Object.keys(defaults)
  t.plan((keys.length * 2) + 2)
  let cwd = join(mock, 'empty')

  const result = await inventory({ cwd })
  const { inv, get } = result
  t.assert.ok(inv, 'Inventory returned inventory object')
  t.assert.ok(get, 'Inventory returned getter')

  keys.forEach(key => {
    let invFound = inv[key] || inv[key] === null
    let getFound = get[key]
    t.assert.ok(invFound, `Inventory has entry for: ${key}`)
    t.assert.ok(getFound, `Getter has entry for: ${key}`)
  })

  reset()
})

test('Inventory a maxed-out project', async t => {
  let keys = Object.keys(defaults)
  t.plan((keys.length * 2) + 2)
  let cwd = join(mock, 'max')

  const result = await inventory({ cwd })
  const { inv, get } = result
  t.assert.ok(inv, 'Inventory returned inventory object')
  t.assert.ok(get, 'Inventory returned getter')

  keys.forEach(key => {
    let invFound = inv[key]
    let getFound = get[key]
    if (key === 'customLambdas') {
      t.assert.equal(invFound, undefined, `Inventory has no entry for: ${key}`)
    }
    else {
      t.assert.ok(invFound, `Inventory has entry for: ${key}`)
    }
    t.assert.ok(getFound, `Getter has entry for: ${key}`)
  })

  reset()
})

test('Inventory a project with a plugin that registers lambdas', async t => {
  t.plan(19)
  let cjs = 'pubsub-cjs'
  let esm = 'pubsub-esm'
  let cjsPragma = 'custom-' + cjs
  let esmPragma = 'custom-' + esm

  let cwd = join(mock, 'plugin-lambdae')
  let channelOneDir = join(cwd, 'src', cjs, 'channel-one')
  let channelTwoDir = join(cwd, 'src', cjs, 'channel-two')
  let channelThreeDir = join(cwd, 'src', esm, 'channel-three')
  let channelFourDir = join(cwd, 'src', esm, 'channel-four')

  const result = await inventory({ cwd })
  const { inv } = result

  t.assert.ok(inv.plugins[cjsPragma], 'CJS plugin registered')
  t.assert.ok(inv.plugins[esmPragma], 'ESM setter plugin registered')
  t.assert.ok(inv.plugins.rando, 'ESM sandbox plugin registered')
  t.assert.equal(typeof inv.plugins[cjsPragma], 'object', 'custom plugin module pulled into inventory')
  t.assert.equal(typeof inv.plugins[esmPragma], 'object', 'custom plugin module pulled into inventory')
  t.assert.equal(typeof inv.plugins.rando, 'object', 'custom plugin module pulled into inventory')
  t.assert.equal(inv['customLambdas'].length, 4, `inv['customLambdas'] contains two plugin custom lambdae`)
  t.assert.equal(inv['customLambdas'][0].src, channelOneDir, `inv['customLambdas'] contains first of four plugin custom lambdae`)
  t.assert.equal(inv['customLambdas'][1].src, channelTwoDir, `inv['customLambdas'] contains second of four plugin custom lambdae`)
  t.assert.equal(inv['customLambdas'][2].src, channelThreeDir, `inv['customLambdas'] contains third of four plugin custom lambdae`)
  t.assert.equal(inv['customLambdas'][3].src, channelFourDir, `inv['customLambdas'] contains fourth of four plugin custom lambdae`)
  t.assert.ok(inv.lambdaSrcDirs.includes(channelOneDir), 'lambdaSrcDirs contains first of four plugin custom lambdae')
  t.assert.ok(inv.lambdaSrcDirs.includes(channelTwoDir), 'lambdaSrcDirs contains second of four plugin custom lambdae')
  t.assert.ok(inv.lambdaSrcDirs.includes(channelThreeDir), 'lambdaSrcDirs contains third of four plugin custom lambdae')
  t.assert.ok(inv.lambdaSrcDirs.includes(channelFourDir), 'lambdaSrcDirs contains fourth of four plugin custom lambdae')
  t.assert.ok(inv.lambdasBySrcDir[channelOneDir], 'lambdasBySrcDir contains first of four plugin custom lambdae')
  t.assert.ok(inv.lambdasBySrcDir[channelTwoDir], 'lambdasBySrcDir contains second of four plugin custom lambdae')
  t.assert.ok(inv.lambdasBySrcDir[channelThreeDir], 'lambdasBySrcDir contains third of four plugin custom lambdae')
  t.assert.ok(inv.lambdasBySrcDir[channelFourDir], 'lambdasBySrcDir contains fourth of four plugin custom lambdae')

  reset()
})

