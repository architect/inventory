let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'tables-indexes')
let populateTablesIndexes = require(sut)

let inventory = inventoryDefaults()

test('Set up env', t => {
  t.plan(1)
  t.ok(populateTablesIndexes, '@tables-indexes populator is present')
})

test('No @tables-indexes returns null', t => {
  t.plan(1)
  t.equal(populateTablesIndexes({ arc: {} }), null, 'Returned null')
})

test('@tables-indexes population', t => {
  t.plan(16)

  let arc = parse(`
@tables
whatever

@tables-indexes
string-keys
  strID *String
  strSort **String
number-keys
  numID *Number
  numSort **Number
number-keys # Second index on the same table
  numID *Number
`)
  let indexes = populateTablesIndexes({ arc })
  t.ok(indexes.length === 3, 'Got correct number of indexes back')
  t.equal(indexes[0].name, 'string-keys', 'Got back correct name for first index')
  t.equal(indexes[0].partitionKey, 'strID', 'Got back correct partition key for first index')
  t.equal(indexes[0].partitionKeyType, 'String', 'Got back correct partition key type for first index')
  t.equal(indexes[0].sortKey, 'strSort', 'Got back correct sort key for first index')
  t.equal(indexes[0].sortKeyType, 'String', 'Got back correct sort key type for first index')
  t.equal(indexes[1].name, 'number-keys', 'Got back correct name for second index')
  t.equal(indexes[1].partitionKey, 'numID', 'Got back correct partition key for second index')
  t.equal(indexes[1].partitionKeyType, 'Number', 'Got back correct partition key type for second index')
  t.equal(indexes[1].sortKey, 'numSort', 'Got back correct sort key for second index')
  t.equal(indexes[1].sortKeyType, 'Number', 'Got back correct sort key type for second index')
  t.equal(indexes[2].name, 'number-keys', 'Got back correct name for second index')
  t.equal(indexes[2].partitionKey, 'numID', 'Got back correct partition key for second index')
  t.equal(indexes[2].partitionKeyType, 'Number', 'Got back correct partition key type for second index')
  t.equal(indexes[2].sortKey, null, 'Got back correct sort key for second index')
  t.equal(indexes[2].sortKeyType, null, 'Got back correct sort key type for second index')
})

test('@tables-indexes parses custom indexName', t => {
  t.plan(4)

  let arc = parse(`
@tables
whatever

@tables-indexes
string-keys
  strID *String
  strSort **String
  name CustomIndex
number-keys
  numID *Number
  numSort **Number
number-keys # Second index on the same table
  numID *Number
  name MyNumberIndex
`)

  let indexes = populateTablesIndexes({ arc })
  t.ok(indexes.length === 3, 'Got correct number of indexes back')
  t.equal(indexes[0].indexName, 'CustomIndex', 'Got back custom index name for first index')
  t.equal(indexes[1].indexName, null, 'Got correct indexName for second index')
  t.equal(indexes[2].indexName, 'MyNumberIndex', 'Got correct indexName for third index')
})

test('@tables-indexes population: validation errors', t => {
  t.plan(14)
  let errors = []
  function run (str) {
    let arc = parse(str)
    populateTablesIndexes({ arc, inventory, errors })
  }
  function check (str = 'Invalid index errored', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }
  let indexes = `@tables-indexes\n`
  let tables = `@tables\n`

  // Controls
  let attr = `\n  id *String`
  run(`${tables}${indexes}hello${attr}`)
  run(`${tables}${indexes}hello${attr}\nhello\n  data *String`)
  run(`${tables}${indexes}hello-there${attr}`)
  run(`${tables}${indexes}hello.there${attr}`)
  run(`${tables}${indexes}helloThere${attr}`)
  run(`${tables}${indexes}h3llo_there${attr}`)
  t.equal(errors.length, 0, `Valid indexes did not error`)

  // Errors
  run(`${tables}@indexes\nhello${attr}\n${indexes}hello${attr}`)
  check(`Cannot specify @ndexes and @tables-indexes`)

  run(`${indexes}hi`)
  check(`Indexes require tables`)

  run(`${tables}${indexes}hello${attr}\nhello${attr}\nhello${attr}`)
  check(`Duplicate indexes errored`)

  run(`${tables}${indexes}hi`)
  check()

  run(`${tables}${indexes}hello
  there`)
  check()

  run(`${tables}${indexes}hello
  there friend`)
  check()

  run(`${tables}${indexes}hello
  there **String`)
  check(`Primary keys are required`)

  run(`${tables}${indexes}hello
  there *string`)
  check(`Primary key casing matters`)

  run(`${tables}${indexes}hi there`)
  check()

  run(`${tables}${indexes}hi-there!`)
  check()

  let name = Array.from(Array(130), () => 'hi').join('')
  run(`${tables}${indexes}${name}${attr}`)
  check()

  run(`${tables}${indexes}hello
  ${name} *String`)
  check()

  run(`${tables}${indexes}hello
  data *String
  ${name} **String`)
  check()
})
