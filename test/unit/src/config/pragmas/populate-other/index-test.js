let { join } = require('path')
let test = require('tape')
let cwd = process.cwd()
let _defaults = join(cwd, 'src', 'defaults')
let defaultConfig = require(_defaults)
let sut = join(cwd, 'src', 'config', 'pragmas', 'populate-other')
let populateOther = require(sut)

test('Set up env', t => {
  t.plan(3)
  t.ok(populateOther.resources, 'Resource pragma populator is present')
  t.ok(populateOther.settings, 'Setting pragma populator is present')
  t.ok(defaultConfig, 'Default config is present')
})

test('Do nothing', t => {
  t.plan(4)
  let result
  let arc = {}
  let inventory = defaultConfig()
  let errors = []

  result = populateOther.resources({ arc, inventory, errors })
  t.equal(result, undefined, 'Returned undefined')
  t.notOk(errors.length, 'No errors returned')

  result = populateOther.settings({ arc, inventory, errors })
  t.equal(result, undefined, 'Returned undefined')
  t.notOk(errors.length, 'No errors returned')
})

test('Populate resources (via plugin)', t => {
  t.plan(54)
  let inventory = defaultConfig(), plugins, result, returning
  let type = 'tables'
  let errors = []
  function check (item) {
    t.notOk(errors.length, 'No errors returned')
    t.equal(item.plugin, 'test', 'Resource identified by plugin name')
    t.equal(item.type, 'plugin', 'Resource identified as having been created by a plugin')
    errors = []
  }

  let name1 = 'resource-name-1'
  let name2 = 'resource-name-2'
  let prop = null
  let template = { prop }

  let fn = () => (returning)
  let fn2x = () => ([ returning, returning ])
  fn.plugin = fn2x.plugin = 'test'
  fn.type = fn2x.type = 'plugin'

  // One setter, one resource (with prop backfilled by template)
  plugins = [ fn ]
  returning = { name1 }
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  t.equal(result.length, 1, 'Returned a resource')
  t.equal(result[0].prop, null, 'Backfilled property from template')
  check(result[0])

  // One setter, one resource (with prop returned)
  returning = { name1, prop: 'resource-prop' }
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  t.equal(result.length, 1, 'Returned a resource')
  t.equal(result[0].prop, 'resource-prop', 'Returned property overrides template')
  check(result[0])

  // One setter, multiple resources
  returning = [ { name1 }, { name2 } ]
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  t.equal(result.length, 2, 'Returned multiple resources')
  t.equal(result[0].prop, null, 'Backfilled property from template')
  t.equal(result[1].prop, null, 'Backfilled property from template')
  check(result[0])
  check(result[1])

  // Multiple setters, one resource each (with prop backfilled by template)
  plugins = [ fn, fn ]
  returning = { name1 }
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  t.equal(result.length, 2, 'Returned multiple resources')
  t.equal(result[0].prop, null, 'Backfilled property from template')
  t.equal(result[1].prop, null, 'Backfilled property from template')
  check(result[0])
  check(result[1])

  // Multiple setters, multiple resources (with prop returned)
  plugins = [ fn, fn ]
  returning = { name1, prop: 'resource-prop' }
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  t.equal(result.length, 2, 'Returned multiple resources')
  t.equal(result[0].prop, 'resource-prop', 'Returned property overrides template')
  t.equal(result[1].prop, 'resource-prop', 'Returned property overrides template')
  check(result[0])
  check(result[1])

  // Multiple setters, one resource each (with prop backfilled by template)
  plugins = [ fn, fn ]
  returning = [ { name1 }, { name2 } ]
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  t.equal(result.length, 4, 'Returned multiple resources')
  t.equal(result[0].prop, null, 'Backfilled property from template')
  t.equal(result[1].prop, null, 'Backfilled property from template')
  t.equal(result[2].prop, null, 'Backfilled property from template')
  t.equal(result[3].prop, null, 'Backfilled property from template')
  check(result[0])
  check(result[1])
  check(result[2])
  check(result[3])
})

test('Plugin resource population errors', t => {
  t.plan(19)
  let inventory = defaultConfig(), fn, plugins, result
  let type = 'tables', template = {}
  let errors = []
  function rtn (item) {
    fn = () => (item)
    fn.plugin = 'test'
    fn.type = 'plugin'
    plugins = [ fn ]
  }
  function check (msg) {
    if (errors.length) console.log(errors[0])
    t.equal(errors.length, 1, 'Returned an error')
    if (msg) {
      t.equal(errors[0], msg, 'Got a setter plugin error')
    }
    else {
      t.equal(errors[0], 'Setter plugins must return a valid response: plugin: test, method: set.tables', 'Got a setter plugin error')
    }
    t.deepEqual(result, [], 'Empty array (no result) returned')
    errors = []
  }

  // String
  rtn('hi')
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  check()

  // Number
  rtn(123)
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  check()

  // Bool
  rtn(true)
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  check()

  // Function
  rtn(() => {})
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  check()

  // Falsy
  rtn(undefined)
  result = populateOther.resources({ inventory, plugins, template, type, errors })
  check()

  // Validation fails
  rtn({ name: 'lol', prop: undefined })
  let valid = { name: 'string', prop: 'number' }
  result = populateOther.resources({ inventory, plugins, template, type, valid, errors })
  check('Invalid plugin-generated @tables resource: prop: undefined')

  // Fail immediately upon setter exception
  fn = params => params.hi.there
  fn.plugin = 'test'
  fn.type = 'plugin'
  plugins = [ fn ]
  t.throws(() => {
    populateOther.resources({ inventory, plugins, template, type, valid, errors })
  }, /Setter plugin exception/, 'Failing setter threw')
})

test('Populate settings (via plugin)', t => {
  t.plan(21)
  let inventory = defaultConfig(), plugins, result, returning
  let type = 'tables'
  let errors = []
  function check () {
    t.notOk(errors.length, 'No errors returned')
    errors = []
  }

  let name1 = 'resource-name-1'
  let prop = null

  let fn = () => (returning)
  let fn2x = () => ([ returning, returning ])
  fn.plugin = fn2x.plugin = 'test'
  fn.type = fn2x.type = 'plugin'
  let settings = { prop }

  // One setter, ignores properties not specified in settings
  plugins = [ fn ]
  returning = { name1 }
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  t.ok(result, 'Returned settings')
  t.deepEqual(result, settings, 'Backfilled default setting')
  check()

  // One setter, returns a property from settings
  plugins = [ fn ]
  returning = { prop: 'hi' }
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  t.ok(result, 'Returned settings')
  t.deepEqual(result, returning, 'Returned property overrides setting')
  check()

  // One setter, returns multiple properties
  plugins = [ fn ]
  returning = { prop: 'hi' }
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  t.ok(result, 'Returned settings')
  t.equal(result.prop, 'hi', 'Returned property overrides setting')
  check()

  // Multiple setters, ignores properties not specified in settings
  plugins = [ fn, fn ]
  returning = { name1 }
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  t.ok(result, 'Returned settings')
  t.deepEqual(result, settings, 'Backfilled default setting')
  check()

  // Multiple setters, returns a property from settings
  plugins = [ fn, fn ]
  returning = { prop: 'hi' }
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  t.ok(result, 'Returned settings')
  t.deepEqual(result, returning, 'Returned property overrides setting')
  check()

  // Multiple setters
  plugins = [ fn, fn ]
  returning = { prop: 'hi' }
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  t.ok(result, 'Returned settings')
  t.equal(result.prop, 'hi', 'Returned property overrides setting')
  check()

  // Multiple setters, last one wins
  plugins = [ () => ({ prop: 1 }), () => ({ prop: 2 }) ]
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  t.ok(result, 'Returned settings')
  t.equal(result.prop, 2, 'Returned property overrides setting')
  check()
})

test('Plugin settings population errors', t => {
  t.plan(19)
  let inventory = defaultConfig(), fn, plugins, result
  let type = 'tables', settings = {}
  let errors = []
  function rtn (item) {
    fn = () => (item)
    fn.plugin = 'test'
    fn.type = 'plugin'
    plugins = [ fn ]
  }
  function check (msg) {
    if (errors.length) console.log(errors)
    t.equal(errors.length, 1, 'Returned an error')
    if (msg) {
      t.equal(errors[0], msg, 'Got a setter plugin error')
    }
    else {
      t.equal(errors[0], 'Setter plugins must return a valid response: plugin: test, method: set.tables', 'Got a setter plugin error')
    }
    t.equal(result, null, 'Null (no result) returned')
    errors = []
  }

  // String
  rtn('hi')
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  check()

  // Number
  rtn(123)
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  check()

  // Bool
  rtn(true)
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  check()

  // Function
  rtn(() => {})
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  check()

  // Falsy
  rtn(undefined)
  result = populateOther.settings({ inventory, plugins, settings, type, errors })
  check()

  // Validation fails
  rtn({ name: true })
  let valid = { name: 'string' }
  settings = { name: null }
  result = populateOther.settings({ inventory, plugins, settings, type, valid, errors })
  check('Invalid plugin-generated @tables resource: name: true')

  // Fail immediately upon setter exception
  fn = params => params.hi.there
  fn.plugin = 'test'
  fn.type = 'plugin'
  plugins = [ fn ]
  t.throws(() => {
    populateOther.settings({ inventory, plugins, type, valid, errors })
  }, /Setter plugin exception/, 'Failing setter threw')
})
