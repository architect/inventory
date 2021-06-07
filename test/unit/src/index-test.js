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
      t.ok(result.inv, 'Returned inventory object')
      t.ok(result.get, 'Returned getter')
      t.equal(result.inv._project.manifest, join(mock, 'max', 'app.arc'), 'Using a manifest file')
    }
  })
})

test('Inventory calls callback (manifest in params)', t => {
  t.plan(3)
  inv({ rawArc }, (err, result) => {
    if (err) t.fail(err)
    else {
      t.ok(result.inv, 'Returned inventory object')
      t.ok(result.get, 'Returned getter')
      t.equal(result.inv._project.manifest, null, 'Not using a manifest file')
    }
  })
})

test('Inventory returns single first-pass validation error', t => {
  t.plan(3)
  inv({ cwd: join(mock, 'fail', 'bad-pragma') }, (err) => {
    if (!err) t.fail('Should have returned an error')
    else {
      let { message, ARC_ERRORS } = err
      t.ok(message.startsWith('Validation error in app.arc'), 'Returned validation error message')
      t.equal(ARC_ERRORS.type, 'validation', 'Returned validation error type')
      t.equal(ARC_ERRORS.errors.length, 1, 'Returned validation error array')
      console.log(err)
    }
  })
})

test('Inventory returns single first-pass validation error (async)', async t => {
  t.plan(3)
  try {
    await inv({ cwd: join(mock, 'fail', 'bad-pragma') })
    t.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.ok(message.startsWith('Validation error in app.arc:'), 'Returned validation error message')
    t.equal(ARC_ERRORS.type, 'validation', 'Returned validation error type')
    t.equal(ARC_ERRORS.errors.length, 1, 'Returned validation error array')
  }
})

test('Inventory returns multiple first-pass validation errors', t => {
  t.plan(3)
  let rawArc = `@http\nwell hello there`
  inv({ rawArc }, (err) => {
    if (!err) t.fail('Should have returned an error')
    else {
      let { message, ARC_ERRORS } = err
      t.ok(message.startsWith('Validation errors:'), 'Returned validation error message')
      t.equal(ARC_ERRORS.type, 'validation', 'Returned validation error type')
      t.equal(ARC_ERRORS.errors.length, 2, 'Returned validation error array')
    }
  })
})

test('Inventory returns multiple first-pass validation errors (async)', async t => {
  t.plan(3)
  try {
    let rawArc = `@http\nwell hello there`
    await inv({ rawArc })
    t.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.ok(message.startsWith('Validation errors:'), 'Returned validation error message')
    t.equal(ARC_ERRORS.type, 'validation', 'Returned validation error type')
    t.equal(ARC_ERRORS.errors.length, 2, 'Returned validation error array')
  }
})

test('Inventory returns second-pass validation error', t => {
  t.plan(3)
  let rawArc = `@app
my-app
@tables
foo
@streams
bar`
  inv({ rawArc }, (err) => {
    if (!err) t.fail('Should have returned an error')
    else {
      let { message, ARC_ERRORS } = err
      t.ok(message.startsWith('Validation error:'), 'Returned validation error message')
      t.equal(ARC_ERRORS.type, 'validation', 'Returned validation error type')
      t.equal(ARC_ERRORS.errors.length, 1, 'Returned validation error array')
    }
  })
})

test('Inventory returns second-pass validation error (async)', async t => {
  t.plan(3)
  let rawArc = `@app
my-app
@tables
foo
@streams
bar`
  try {
    await inv({ rawArc })
    t.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.ok(message.startsWith('Validation error:'), 'Returned validation error message')
    t.equal(ARC_ERRORS.type, 'validation', 'Returned validation error type')
    t.equal(ARC_ERRORS.errors.length, 1, 'Returned validation error array')
  }
})

test('Inventory returns second-pass configuration error', t => {
  t.plan(3)
  let rawArc = `@app
my-app
@aws
layer foo`
  inv({ rawArc }, (err) => {
    if (!err) t.fail('Should have returned an error')
    else {
      let { message, ARC_ERRORS } = err
      t.ok(message.startsWith('Configuration error:'), 'Returned configuration error message')
      t.equal(ARC_ERRORS.type, 'configuration', 'Returned configuration error type')
      t.equal(ARC_ERRORS.errors.length, 1, 'Returned configuration error array')
    }
  })
})

test('Inventory returns second-pass validation error (async)', async t => {
  t.plan(3)
  let rawArc = `@app
my-app
@aws
layer foo`
  try {
    await inv({ rawArc })
    t.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.ok(message.startsWith('Configuration error:'), 'Returned configuration error message')
    t.equal(ARC_ERRORS.type, 'configuration', 'Returned configuration error type')
    t.equal(ARC_ERRORS.errors.length, 1, 'Returned configuration error array')
  }
})

test('Inventory invokes async (manifest on disk)', async t => {
  t.plan(3)
  try {
    let result = await inv({ cwd: join(mock, 'max') })
    t.ok(result.inv, 'Returned inventory object')
    t.ok(result.get, 'Returned getter')
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
    t.ok(result.inv, 'Returned inventory object')
    t.ok(result.get, 'Returned getter')
    t.equal(result.inv._project.manifest, null, 'Not using a manifest file')
  }
  catch (err) {
    t.fail(err)
  }
})

test(`Inventory doesn't blow up without params`, async t => {
  t.plan(1)
  try {
    await inv()
    t.pass(`Shouldn't have returned an error`)
  }
  catch (err) {
    t.fail(err)
  }
})

test('Manifest error', t => {
  t.plan(6)
  inv({ cwd: join(mock, 'fail', 'bad-manifest') }, err => {
    if (!err) t.fail('Should have returned an error')
    else {
      let { message, ARC_ERRORS } = err
      t.ok(message.startsWith('Manifest error:'), 'Returned manifest error message')
      t.equal(ARC_ERRORS.type, 'manifest', 'Returned manifest error type')
      t.equal(ARC_ERRORS.errors.length, 1, 'Returned manifest error array')
    }
  })
  inv({ rawArc: '\n' }, err => {
    if (!err) t.fail('Should have returned an error')
    else {
      let { message, ARC_ERRORS } = err
      t.ok(message.startsWith('Manifest error:'), 'Returned manifest error message')
      t.equal(ARC_ERRORS.type, 'manifest', 'Returned manifest error type')
      t.equal(ARC_ERRORS.errors.length, 1, 'Returned manifest error array')
    }
  })
})

test('Manifest error (async)', async t => {
  t.plan(6)
  try {
    await inv({ cwd: join(mock, 'fail', 'bad-manifest') })
    t.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.ok(message.startsWith('Manifest error:'), 'Returned manifest error message')
    t.equal(ARC_ERRORS.type, 'manifest', 'Returned manifest error type')
    t.equal(ARC_ERRORS.errors.length, 1, 'Returned manifest error array')
  }
  try {
    await inv({ rawArc: '\n' })
    t.fail('Should have returned an error')
  }
  catch (err) {
    let { message, ARC_ERRORS } = err
    t.ok(message.startsWith('Manifest error:'), 'Returned manifest error message')
    t.equal(ARC_ERRORS.type, 'manifest', 'Returned manifest error type')
    t.equal(ARC_ERRORS.errors.length, 1, 'Returned manifest error array')
  }
})
