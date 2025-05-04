let { join } = require('node:path')
let { test } = require('node:test')
let inventory = require('../../../src/index')

let mock = join(process.cwd(), 'test', 'mock')
let rawArc = `@app\na-stateless-app\n@http`

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(inventory, 'Inventory entry is present')
})

test('Inventory calls callback (manifest on disk)', async t => {
  t.plan(3)
  let result = await inventory({ cwd: join(mock, 'max') })
  t.assert.ok(result.inv, 'Returned inventory object')
  t.assert.ok(result.get, 'Returned getter')
  t.assert.equal(result.inv._project.manifest, join(mock, 'max', 'app.arc'), 'Using a manifest file')
})

test('Inventory calls callback (manifest via rawArc param)', async t => {
  t.plan(3)
  let result = await inventory({ rawArc })
  t.assert.ok(result.inv, 'Returned inventory object')
  t.assert.ok(result.get, 'Returned getter')
  t.assert.equal(result.inv._project.manifest, null, 'Not using a manifest file')
})

test('Inventory returns single early manifest validation error', async t => {
  t.plan(3)
  try {
    await inventory({ cwd: join(mock, 'fail', 'bad-pragma') })
    t.assert.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.assert.ok(message.startsWith('Validation error'), 'Returned validation error message')
    t.assert.equal(ARC_ERRORS.type, 'validation', 'Returned validation error type')
    t.assert.equal(ARC_ERRORS.errors.length, 1, 'Returned validation error array')
  }
})

test('Inventory returns multiple early manifest validation errors', async t => {
  t.plan(3)
  let rawArc = `@http\nwell hello there`
  try {
    await inventory({ rawArc })
    t.assert.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.assert.ok(message.startsWith('Validation errors:'), 'Returned validation error message')
    t.assert.equal(ARC_ERRORS.type, 'validation', 'Returned validation error type')
    t.assert.equal(ARC_ERRORS.errors.length, 2, 'Returned validation error array')
  }
})

test('Inventory returns plugin error', async t => {
  t.plan(3)
  let rawArc = `@app
my-app
@plugins
foo`
  try {
    await inventory({ rawArc })
    t.assert.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.assert.ok(message.startsWith('Plugin error:'), 'Returned plugin error message')
    t.assert.equal(ARC_ERRORS.type, 'plugin', 'Returned plugin error type')
    t.assert.equal(ARC_ERRORS.errors.length, 1, 'Returned plugin error array')
  }
})

test('Inventory returns validation error', async t => {
  t.plan(3)
  let rawArc = `@app
my-app
@tables
foo
@tables-streams
bar`
  try {
    await inventory({ rawArc })
    t.assert.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.assert.ok(message.startsWith('Validation error:'), 'Returned validation error message')
    t.assert.equal(ARC_ERRORS.type, 'validation', 'Returned validation error type')
    t.assert.equal(ARC_ERRORS.errors.length, 1, 'Returned validation error array')
  }
})

test('Inventory returns configuration error', async t => {
  t.plan(3)
  let rawArc = `@app
my-app
@aws
layer foo`
  try {
    await inventory({ rawArc })
    t.assert.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.assert.ok(message.startsWith('Configuration error:'), 'Returned configuration error message')
    t.assert.equal(ARC_ERRORS.type, 'configuration', 'Returned configuration error type')
    t.assert.equal(ARC_ERRORS.errors.length, 1, 'Returned configuration error array')
  }
})

test('Inventory invokes async (manifest on disk)', async t => {
  t.plan(3)
  let result = await inventory({ cwd: join(mock, 'max') })
  t.assert.ok(result.inv, 'Returned inventory object')
  t.assert.ok(result.get, 'Returned getter')
  t.assert.equal(result.inv._project.manifest, join(mock, 'max', 'app.arc'), 'Using a manifest file')
})

test('Inventory invokes async (manifest via rawArc param)', async t => {
  t.plan(3)
  let result = await inventory({ rawArc })
  t.assert.ok(result.inv, 'Returned inventory object')
  t.assert.ok(result.get, 'Returned getter')
  t.assert.equal(result.inv._project.manifest, null, 'Not using a manifest file')
})

test(`Inventory doesn't blow up without params`, async t => {
  t.plan(1)
  try {
    await inventory()
    t.assert.ok(true, `Shouldn't have returned an error`)
  }
  catch (err) {
    t.assert.fail(err)
  }
})

test('Manifest error (bad-manifest)', async t => {
  t.plan(3)
  try {
    await inventory({ cwd: join(mock, 'fail', 'bad-manifest') })
    t.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.assert.ok(message.startsWith('Manifest error:'), 'Returned manifest error message')
    t.assert.equal(ARC_ERRORS.type, 'manifest', 'Returned manifest error type')
    t.assert.equal(ARC_ERRORS.errors.length, 1, 'Returned manifest error array')
  }
})

test('Manifest error (empty rawArc)', async t => {
  t.plan(3)
  try {
    await inventory({ rawArc: '\n' })
    t.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.assert.ok(message.startsWith('Manifest error:'), 'Returned manifest error message')
    t.assert.equal(ARC_ERRORS.type, 'manifest', 'Returned manifest error type')
    t.assert.equal(ARC_ERRORS.errors.length, 1, 'Returned manifest error array')
  }
})
