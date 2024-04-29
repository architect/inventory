let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let cwd = process.cwd()
let inventoryDefaultsPath = join(cwd, 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let testLibPath = join(cwd, 'test', 'lib')
let testLib = require(testLibPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'tables')
let populateTables = require(sut)

let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'tables')

test('Set up env', t => {
  t.plan(1)
  t.ok(populateTables, '@tables populator is present')
})

test('No @tables returns null', t => {
  t.plan(1)
  let inventory = inventoryDefaults()
  t.equal(populateTables({ arc: {}, inventory }), null, 'Returned null')
})

test('@tables population', t => {
  t.plan(13)

  let arc = parse(`
@tables
string-keys
  strID *String
  strSort **String
number-keys
  numID *Number
  numSort **Number
  stream true
`)
  let inventory = inventoryDefaults()
  let tables = populateTables({ arc, inventory })
  t.ok(tables.length === 2, 'Got correct number of tables back')
  t.equal(tables[0].name, 'string-keys', 'Got back correct name for first table')
  t.equal(tables[0].partitionKey, 'strID', 'Got back correct partition key for first table')
  t.equal(tables[0].partitionKeyType, 'String', 'Got back correct partition key type for first table')
  t.equal(tables[0].sortKey, 'strSort', 'Got back correct sort key for first table')
  t.equal(tables[0].sortKeyType, 'String', 'Got back correct sort key type for first table')
  t.equal(tables[0].stream, null, 'Got back correct stream value for first table')
  t.equal(tables[1].name, 'number-keys', 'Got back correct name for second table')
  t.equal(tables[1].partitionKey, 'numID', 'Got back correct partition key for second table')
  t.equal(tables[1].partitionKeyType, 'Number', 'Got back correct partition key type for second table')
  t.equal(tables[1].sortKey, 'numSort', 'Got back correct sort key for second table')
  t.equal(tables[1].sortKeyType, 'Number', 'Got back correct sort key type for second table')
  t.equal(tables[1].stream, true, 'Got back correct stream value for second table')
})

test('@tables population (extra params)', t => {
  t.plan(20)

  let arc = parse(`
@tables
string-keys
  strID *String
  strSort **String
  stream true
  _ttl ttl
  pitr true
  encrypt true
`)
  let inventory = inventoryDefaults()
  let tables = populateTables({ arc, inventory })
  t.ok(tables.length === 1, 'Got correct number of tables back')
  t.equal(tables[0].name, 'string-keys', 'Got back correct name')
  t.equal(tables[0].partitionKey, 'strID', 'Got back correct partition key')
  t.equal(tables[0].partitionKeyType, 'String', 'Got back correct partition key type')
  t.equal(tables[0].sortKey, 'strSort', 'Got back correct sort key')
  t.equal(tables[0].sortKeyType, 'String', 'Got back correct sort key type')
  t.equal(tables[0].stream, true, 'Got back correct stream value')
  t.equal(tables[0].ttl, '_ttl', 'Got back correct TTL value')
  t.equal(tables[0].pitr, true, 'Got back correct pitr value')
  t.equal(tables[0].encrypt, true, 'Got back correct encrypt value')

  // Key type casing + shortcuts
  arc = parse(`
@tables
string-keys
  strID *string
  numSort **number
  PITR true
`)
  inventory = inventoryDefaults()
  tables = populateTables({ arc, inventory })
  t.ok(tables.length === 1, 'Got correct number of tables back')
  t.equal(tables[0].partitionKeyType, 'String', 'Got back correct partition key type')
  t.equal(tables[0].sortKeyType, 'Number', 'Got back correct sort key type')

  arc = parse(`
@tables
string-keys
  strID *
  numSort **
  PITR true
`)
  inventory = inventoryDefaults()
  tables = populateTables({ arc, inventory })
  t.ok(tables.length === 1, 'Got correct number of tables back')
  t.equal(tables[0].partitionKeyType, 'String', 'Got back correct partition key type')
  t.equal(tables[0].sortKeyType, 'String', 'Got back correct sort key type')

  // Alt PITR casing
  arc = parse(`
@tables
string-keys
  strID *String
  strSort **String
  PITR true
`)
  inventory = inventoryDefaults()
  tables = populateTables({ arc, inventory })
  t.ok(tables.length === 1, 'Got correct number of tables back')
  t.equal(tables[0].pitr, true, 'Got back correct pitr value')

  // Alt TTL casing
  arc = parse(`
@tables
string-keys
  strID *String
  strSort **String
  _ttl TTL
`)
  inventory = inventoryDefaults()
  tables = populateTables({ arc, inventory })
  t.ok(tables.length === 1, 'Got correct number of tables back')
  t.equal(tables[0].ttl, '_ttl', 'Got back correct TTL value')
})

test('@tables population: plugin setter', t => {
  t.plan(16)
  let inventory, setter, tables

  inventory = inventoryDefaults()
  setter = () => ({
    name: 'string-keys',
    partitionKey: 'strID',
    partitionKeyType: 'String',
    sortKey: 'strSort',
    sortKeyType: 'String',
    stream: true,
    ttl: '_ttl',
    pitr: true,
    encrypt: true,
  })
  inventory.plugins = setterPluginSetup(setter)
  tables = populateTables({ arc: {}, inventory })
  t.ok(tables.length === 1, 'Got correct number of tables back')
  t.equal(tables[0].name, 'string-keys', 'Got back correct name')
  t.equal(tables[0].partitionKey, 'strID', 'Got back correct partition key')
  t.equal(tables[0].partitionKeyType, 'String', 'Got back correct partition key type')
  t.equal(tables[0].sortKey, 'strSort', 'Got back correct sort key')
  t.equal(tables[0].sortKeyType, 'String', 'Got back correct sort key type')
  t.equal(tables[0].stream, true, 'Got back correct stream value')
  t.equal(tables[0].ttl, '_ttl', 'Got back correct TTL value')
  t.equal(tables[0].pitr, true, 'Got back correct pitr value')
  t.equal(tables[0].encrypt, true, 'Got back correct encrypt value')

  // Key type casing
  inventory = inventoryDefaults()
  setter = () => ({
    name: 'string-keys',
    partitionKey: 'strID',
    partitionKeyType: 'string',
    sortKey: 'numSort',
    sortKeyType: 'number',
  })
  inventory.plugins = setterPluginSetup(setter)
  tables = populateTables({ arc: {}, inventory })
  t.ok(tables.length === 1, 'Got correct number of tables back')
  t.equal(tables[0].name, 'string-keys', 'Got back correct name')
  t.equal(tables[0].partitionKey, 'strID', 'Got back correct partition key')
  t.equal(tables[0].partitionKeyType, 'String', 'Got back correct partition key type')
  t.equal(tables[0].sortKey, 'numSort', 'Got back correct sort key')
  t.equal(tables[0].sortKeyType, 'Number', 'Got back correct sort key type')
})

test('@tables population (legacy params)', t => {
  t.plan(7)

  let arc = parse(`
@tables
string-keys
  strID *String
  PointInTimeRecovery true
  insert Lambda # Legacy param (ignored)
  update Lambda # Legacy param (ignored)
  delete Lambda # Legacy param (ignored)
`)
  let inventory = inventoryDefaults()
  let tables = populateTables({ arc, inventory })
  t.ok(tables.length === 1, 'Got correct number of tables back')
  t.equal(tables[0].name, 'string-keys', 'Got back correct name')
  t.equal(tables[0].partitionKey, 'strID', 'Got back correct partition key')
  t.equal(tables[0].PointInTimeRecovery, true, 'Got back correct pitr value')
  t.equal(tables[0].insert, undefined, 'Skipped deprecated insert Lambda setting')
  t.equal(tables[0].update, undefined, 'Skipped deprecated update Lambda setting')
  t.equal(tables[0].delete, undefined, 'Skipped deprecated delete Lambda setting')
})

test('@tables population: validation errors', t => {
  t.plan(12)
  let errors = []
  let inventory = inventoryDefaults()
  function run (str) {
    let arc = parse(`@tables\n${str}`)
    populateTables({ arc, inventory, errors })
  }
  function check (str = 'Invalid table errored', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Controls
  let attr = `\n  id *String`
  run(`hello${attr}`)
  run(`hello-there${attr}`)
  run(`hello.there${attr}`)
  run(`helloThere${attr}`)
  run(`h3llo_there${attr}`)
  t.equal(errors.length, 0, `Valid tables did not error`)

  // Errors
  run(`hello${attr}\nhello${attr}\nhello${attr}`)
  check(`Duplicate tables errored`)

  run(`hello
  id *String
hello
  data *String`)
  check(`Similarly duplicate tables errored`)

  run(`hi`)
  check()

  run(`hello
  there`)
  check(undefined, 2)

  run(`hello
  there friend`)
  check(undefined, 2)

  run(`hello
  there **String`)
  check(`Primary keys are required`, 2)

  run(`hi there`)
  check()

  run(`hi-there!`)
  check()

  let name = Array.from(Array(130), () => 'hi').join('')
  run(`${name}${attr}`)
  check()

  run(`hello
  ${name} *String`)
  check()

  run(`hello
  data *String
  ${name} **String`)
  check()
})

test('@tables: plugin errors', t => {
  t.plan(13)
  let errors = []
  let inventory
  function run (returning) {
    inventory = inventoryDefaults()
    inventory.plugins = setterPluginSetup(() => returning)
    populateTables({ arc: {}, inventory, errors })
  }
  function check (str = 'Invalid table errored', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Controls
  let partitionKey = 'id'
  let partitionKeyType = 'String'
  run({ name: 'hello',        partitionKey, partitionKeyType })
  run({ name: 'hello-there',  partitionKey, partitionKeyType })
  run({ name: 'hello.there',  partitionKey, partitionKeyType })
  run({ name: 'helloThere',   partitionKey, partitionKeyType })
  run({ name: 'h3llo_there',  partitionKey, partitionKeyType })
  t.equal(errors.length, 0, `Valid tables did not error`)

  // Errors
  run([
    { name: 'hello', partitionKey, partitionKeyType },
    { name: 'hello', partitionKey, partitionKeyType },
    { name: 'hello', partitionKey, partitionKeyType },
  ])
  check(`Duplicate tables errored`)

  run([
    { name: 'hello', partitionKey, partitionKeyType },
    { name: 'hello', partitionKey: 'data', partitionKeyType },
  ])
  check(`Similarly duplicate tables errored`)

  run({ name: `hi`, partitionKey, partitionKeyType })
  check()

  run({ name: `hello` })
  check(undefined, 2)

  run({ name: `hello`, partitionKey })
  check()

  run({ name: `hello`, partitionKeyType })
  check()

  run({ name: `hello`, partitionKeyType: 'lolidk' })
  check()

  run({ name: 'hello', sortKey: 'there', sortKeyType: 'String' })
  check(`Primary keys are required`, 2)

  // FIXME
  // run({ name: `hello`, partitionKey, partitionKeyType: 'string' })
  // check(`Primary key casing matters`)

  run({ name: `hi-there!`, partitionKey, partitionKeyType })
  check()

  let name = Array.from(Array(130), () => 'hi').join('')
  run({ name, partitionKey, partitionKeyType })
  check()

  run({ name: `hello`, partitionKey: name, partitionKeyType })
  check()

  run({ name: `hello`, partitionKey, partitionKeyType, sortKey: name, sortKeyType: 'String' })
  check()
})
