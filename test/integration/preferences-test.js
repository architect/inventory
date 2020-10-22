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

test('Get preferences', t => {
  t.plan(6)
  let cwd = join(mock, 'max')
  let prefs = {
    sandbox: { create: false },
    deploy: false,
    env: {
      testing: { 'env-var-1': 'foo', 'env-var-2': 'bar' },
      staging: { 'env-var-1': 'fiz', 'env-var-2': 'buz' },
      production: { 'env-var-1': 'qix qix', 'env-var-2': 'qux qux' }
    }
  }
  inv({ cwd }, (err, result) => {
    if (err) t.fail(err)
    else {
      let { inventory, get } = result
      t.ok(inventory, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      t.ok(inventory._project.preferences._arc, 'Got preferences (arc)')
      t.ok(inventory._project.preferences._raw, 'Got preferences (raw)')
      // Delete the meta stuff so the actual preferences match the above
      delete inventory._project.preferences._arc
      delete inventory._project.preferences._raw
      t.deepEqual(inventory._project.preferences, prefs, 'Got correct preferences')
      t.equal(inventory._project.preferencesFile, join(cwd, 'preferences.arc'), 'Got correct preferences file')
      reset()
    }
  })
})
