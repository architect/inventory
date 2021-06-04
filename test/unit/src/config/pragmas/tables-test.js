let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'tables')
let populateTables = require(sut)

let inventory = inventoryDefaults()

test('Set up env', t => {
  t.plan(1)
  t.ok(populateTables, '@tables populator is present')
})

test('No @tables returns null', t => {
  t.plan(1)
  t.equal(populateTables({ arc: {} }), null, 'Returned null')
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
  let tables = populateTables({ arc })
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
  t.plan(11)

  let arc = parse(`
@tables
string-keys
  strID *String
  strSort **String
  stream true
  _ttl TTL
  pitr true
  encrypt true
  legacy true
`)
  let tables = populateTables({ arc })
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
  t.equal(tables[0].legacy, true, 'Got back correct legacy value')
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
  let tables = populateTables({ arc })
  t.ok(tables.length === 1, 'Got correct number of tables back')
  t.equal(tables[0].name, 'string-keys', 'Got back correct name')
  t.equal(tables[0].partitionKey, 'strID', 'Got back correct partition key')
  t.equal(tables[0].PointInTimeRecovery, true, 'Got back correct pitr value')
  t.equal(tables[0].insert, undefined, 'Skipped deprecated insert Lambda setting')
  t.equal(tables[0].update, undefined, 'Skipped deprecated update Lambda setting')
  t.equal(tables[0].delete, undefined, 'Skipped deprecated delete Lambda setting')
})

test('@tables population: validation errors', t => {
  t.plan(13)
  let errors = []
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
  check()

  run(`hello
  there friend`)
  check()

  run(`hello
  there **String`)
  check(`Primary keys are required`)

  run(`hello
  there *string`)
  check(`Primary key casing matters`)

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
