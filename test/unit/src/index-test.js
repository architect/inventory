let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'index')
let inv = require(sut)

let mock = join(process.cwd(), 'test', 'mock')
let rawArc = `@app\na-stateless-app\n@http`

test('Set up env', t => {
  t.plan(1)
  t.ok(inv, 'Inventory entry is present')
})

test('Inventory calls callback (manifest on disk)', t => {
  t.plan(3)
  inv({ cwd: join(mock, 'max') }, (err, result) => {
    if (err) t.fail(err)
    else {
      t.ok(result.inv, 'Called back with inventory object')
      t.ok(result.get, 'Called back with getter')
      t.equal(result.inv._project.manifest, join(mock, 'max', 'app.arc'), 'Using a manifest file')
    }
  })
})

test('Inventory calls callback (manifest in params)', t => {
  t.plan(3)
  inv({ rawArc }, (err, result) => {
    if (err) t.fail(err)
    else {
      t.ok(result.inv, 'Called back with inventory object')
      t.ok(result.get, 'Called back with getter')
      t.equal(result.inv._project.manifest, null, 'Not using a manifest file')
    }
  })
})

test('Inventory returns errors', t => {
  t.plan(1)
  inv({ cwd: join(mock, 'fail') }, (err) => {
    if (err) t.pass('Invalid Architect project manifest returned an inventory error')
    else t.fail('Should have returned an error')
  })
})

test('Inventory invokes async (manifest on disk)', async t => {
  t.plan(3)
  try {
    let result = await inv({ cwd: join(mock, 'max') })
    t.ok(result.inv, 'Called back with inventory object')
    t.ok(result.get, 'Called back with getter')
    t.equal(result.inv._project.manifest, join(mock, 'max', 'app.arc'), 'Using a manifest file')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Inventory invokes async (manifest in params)', async t => {
  t.plan(3)
  try {
    let result = await inv({ rawArc })
    t.ok(result.inv, 'Called back with inventory object')
    t.ok(result.get, 'Called back with getter')
    t.equal(result.inv._project.manifest, null, 'Not using a manifest file')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Inventory throws async', async t => {
  t.plan(1)
  try {
    await inv({ cwd: join(mock, 'fail') })
    t.fail('Should have returned an error')
  }
  catch (err) {
    t.pass('Invalid Architect project manifest returned an inventory error')
  }
})
