let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'indexes')
let populateIndexes = require(sut)

let inventory = inventoryDefaults()

test('Set up env', t => {
  t.plan(1)
  t.ok(populateIndexes, '@indexes populator is present')
})

test('No @indexes returns null', t => {
  t.plan(1)
  t.equal(populateIndexes({ arc: {} }), null, 'Returned null')
})

test('@indexes population', t => {
  t.plan(16)

  let arc = parse(`
@tables
whatever

@indexes
string-keys
  strID *String
  strSort **String
number-keys
  numID *Number
  numSort **Number
number-keys # Second index on the same table
  numID *Number
`)
  let indexes = populateIndexes({ arc })
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

test('@indexes parses custom indexName', t => {
  t.plan(4)

  let arc = parse(`
@tables
whatever

@indexes
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

  let indexes = populateIndexes({ arc })
  t.ok(indexes.length === 3, 'Got correct number of indexes back')
  t.equal(indexes[0].indexName, 'CustomIndex', 'Got back custom index name for first index')
  t.equal(indexes[1].indexName, null, 'Got correct indexName for second index')
  t.equal(indexes[2].indexName, 'MyNumberIndex', 'Got correct indexName for third index')
})

test('@indexes parses projection attributes', t => {
  t.plan(12)
  let errors = []

  let arc = parse(`
@tables
no-explicit
  one *String

explicit-all
  one *String

keys-only
  one *String

specified-attributes
  one *String

@indexes
no-explicit
  one *String
  two **String

explicit-all
  one *String
  two **String
  projection all

keys-only
  one *String
  two **String
  projection keys

specified-attributes
  one *String
  two **String
  projection three
  name OneAttrProjIndex

specified-attributes
  one *String
  two **String
  projection four five
  name TwoAttrProjIndex
  `)

  let indexes = populateIndexes({ arc, errors })
  console.log(JSON.stringify(indexes, null, 2))
  t.equal(indexes.length, 5, 'Got correct number of indexes back')
  t.equal(indexes[0].projectionType, 'ALL', 'Got ALL projection type implicitly if no projection details provided')
  t.equal(indexes[0].projectionAttributes, null, 'Projection attributes null implicitly if no projection details provided')
  t.equal(indexes[1].projectionType, 'ALL', 'Got ALL projection type if projection specified as "all"')
  t.equal(indexes[1].projectionAttributes, null, 'Projection attributes null if projection specified as "all"')
  t.equal(indexes[2].projectionType, 'KEYS_ONLY', 'Got KEYS_ONLY projection type if projection specified as "keys"')
  t.equal(indexes[2].projectionAttributes, null, 'Projection attributes null if projection specified as "keys"')
  t.equal(indexes[3].projectionType, 'INCLUDE', 'Got INCLUDE projection type if projection specified with arbitrary string')
  t.ok(indexes[3].projectionAttributes.includes('three'), 'Specified string projected attribute included in projection attributes list')
  t.equal(indexes[4].projectionType, 'INCLUDE', 'Got INCLUDE projection type if projection specified with array of values')
  t.ok(indexes[4].projectionAttributes.includes('four'), 'One of two of the specified string projected attribute included in projection attributes list')
  t.ok(indexes[4].projectionAttributes.includes('five'), 'Two of two of the specified string projected attribute included in projection attributes list')
})

test('@indexes population: validation errors', t => {
  t.plan(13)
  let errors = []
  function run (str) {
    let arc = parse(str)
    populateIndexes({ arc, inventory, errors })
  }
  function check (str = 'Invalid index errored', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }
  let indexes = `@indexes\n`
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
