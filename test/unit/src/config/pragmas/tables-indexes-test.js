let parse = require('@architect/parser')
let { test } = require('node:test')
let inventoryDefaults = require('../../../../../src/defaults')
let testLib = require('../../../../lib')
let populateTablesIndexes = require('../../../../../src/config/pragmas/tables-indexes')

let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'tables-indexes')

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(populateTablesIndexes, '@tables-indexes populator is present')
})

test('No @tables-indexes returns null', t => {
  t.plan(1)
  let inventory = inventoryDefaults()
  t.assert.equal(populateTablesIndexes({ arc: {}, inventory }), null, 'Returned null')
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
  let inventory = inventoryDefaults()
  let indexes = populateTablesIndexes({ arc, inventory })
  t.assert.ok(indexes.length === 3, 'Got correct number of indexes back')
  t.assert.equal(indexes[0].name, 'string-keys', 'Got back correct name for first index')
  t.assert.equal(indexes[0].partitionKey, 'strID', 'Got back correct partition key for first index')
  t.assert.equal(indexes[0].partitionKeyType, 'String', 'Got back correct partition key type for first index')
  t.assert.equal(indexes[0].sortKey, 'strSort', 'Got back correct sort key for first index')
  t.assert.equal(indexes[0].sortKeyType, 'String', 'Got back correct sort key type for first index')
  t.assert.equal(indexes[1].name, 'number-keys', 'Got back correct name for second index')
  t.assert.equal(indexes[1].partitionKey, 'numID', 'Got back correct partition key for second index')
  t.assert.equal(indexes[1].partitionKeyType, 'Number', 'Got back correct partition key type for second index')
  t.assert.equal(indexes[1].sortKey, 'numSort', 'Got back correct sort key for second index')
  t.assert.equal(indexes[1].sortKeyType, 'Number', 'Got back correct sort key type for second index')
  t.assert.equal(indexes[2].name, 'number-keys', 'Got back correct name for second index')
  t.assert.equal(indexes[2].partitionKey, 'numID', 'Got back correct partition key for second index')
  t.assert.equal(indexes[2].partitionKeyType, 'Number', 'Got back correct partition key type for second index')
  t.assert.equal(indexes[2].sortKey, null, 'Got back correct sort key for second index')
  t.assert.equal(indexes[2].sortKeyType, null, 'Got back correct sort key type for second index')
})

test('@tables-indexes population: plugin setter', t => {
  t.plan(22)
  let inventory, setter, indexes

  let arc = parse(`
@tables
whatever`)
  inventory = inventoryDefaults()
  setter = () => ([
    {
      name: 'string-keys',
      partitionKey: 'strID',
      partitionKeyType: 'String',
      sortKey: 'strSort',
      sortKeyType: 'String',
    },
    {
      name: 'number-keys',
      partitionKey: 'numID',
      partitionKeyType: 'Number',
      sortKey: 'numSort',
      sortKeyType: 'Number',
    },
    {
      name: 'number-keys',
      partitionKey: 'numID',
      partitionKeyType: 'Number',
    },
  ])
  inventory.plugins = setterPluginSetup(setter)
  indexes = populateTablesIndexes({ arc, inventory })
  t.assert.ok(indexes.length === 3, 'Got correct number of indexes back')
  t.assert.equal(indexes[0].name, 'string-keys', 'Got back correct name for first index')
  t.assert.equal(indexes[0].partitionKey, 'strID', 'Got back correct partition key for first index')
  t.assert.equal(indexes[0].partitionKeyType, 'String', 'Got back correct partition key type for first index')
  t.assert.equal(indexes[0].sortKey, 'strSort', 'Got back correct sort key for first index')
  t.assert.equal(indexes[0].sortKeyType, 'String', 'Got back correct sort key type for first index')
  t.assert.equal(indexes[1].name, 'number-keys', 'Got back correct name for second index')
  t.assert.equal(indexes[1].partitionKey, 'numID', 'Got back correct partition key for second index')
  t.assert.equal(indexes[1].partitionKeyType, 'Number', 'Got back correct partition key type for second index')
  t.assert.equal(indexes[1].sortKey, 'numSort', 'Got back correct sort key for second index')
  t.assert.equal(indexes[1].sortKeyType, 'Number', 'Got back correct sort key type for second index')
  t.assert.equal(indexes[2].name, 'number-keys', 'Got back correct name for second index')
  t.assert.equal(indexes[2].partitionKey, 'numID', 'Got back correct partition key for second index')
  t.assert.equal(indexes[2].partitionKeyType, 'Number', 'Got back correct partition key type for second index')
  t.assert.equal(indexes[2].sortKey, null, 'Got back correct sort key for second index')
  t.assert.equal(indexes[2].sortKeyType, null, 'Got back correct sort key type for second index')

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
  indexes = populateTablesIndexes({ arc, inventory })
  t.assert.ok(indexes.length === 1, 'Got correct number of indexes back')
  t.assert.equal(indexes[0].name, 'string-keys', 'Got back correct name')
  t.assert.equal(indexes[0].partitionKey, 'strID', 'Got back correct partition key')
  t.assert.equal(indexes[0].partitionKeyType, 'String', 'Got back correct partition key type')
  t.assert.equal(indexes[0].sortKey, 'numSort', 'Got back correct sort key')
  t.assert.equal(indexes[0].sortKeyType, 'Number', 'Got back correct sort key type')
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
  let inventory = inventoryDefaults()
  let indexes = populateTablesIndexes({ arc, inventory })
  t.assert.ok(indexes.length === 3, 'Got correct number of indexes back')
  t.assert.equal(indexes[0].indexName, 'CustomIndex', 'Got back custom index name for first index')
  t.assert.equal(indexes[1].indexName, null, 'Got correct indexName for second index')
  t.assert.equal(indexes[2].indexName, 'MyNumberIndex', 'Got correct indexName for third index')
})

test('@indexes parses projection attributes', t => {
  t.plan(12)

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

@tables-indexes
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

  let inventory = inventoryDefaults()
  let indexes = populateTablesIndexes({ arc, inventory })
  t.assert.equal(indexes.length, 5, 'Got correct number of indexes back')
  t.assert.equal(indexes[0].projectionType, 'ALL', 'Got ALL projection type implicitly if no projection details provided')
  t.assert.equal(indexes[0].projectionAttributes, null, 'Projection attributes null implicitly if no projection details provided')
  t.assert.equal(indexes[1].projectionType, 'ALL', 'Got ALL projection type if projection specified as "all"')
  t.assert.equal(indexes[1].projectionAttributes, null, 'Projection attributes null if projection specified as "all"')
  t.assert.equal(indexes[2].projectionType, 'KEYS_ONLY', 'Got KEYS_ONLY projection type if projection specified as "keys"')
  t.assert.equal(indexes[2].projectionAttributes, null, 'Projection attributes null if projection specified as "keys"')
  t.assert.equal(indexes[3].projectionType, 'INCLUDE', 'Got INCLUDE projection type if projection specified with arbitrary string')
  t.assert.ok(indexes[3].projectionAttributes.includes('three'), 'Specified string projected attribute included in projection attributes list')
  t.assert.equal(indexes[4].projectionType, 'INCLUDE', 'Got INCLUDE projection type if projection specified with array of values')
  t.assert.ok(indexes[4].projectionAttributes.includes('four'), 'One of two of the specified string projected attribute included in projection attributes list')
  t.assert.ok(indexes[4].projectionAttributes.includes('five'), 'Two of two of the specified string projected attribute included in projection attributes list')
})

test('@tables-indexes key type casing + shortcuts', t => {
  t.plan(6)
  let arc, inventory, indexes

  arc = parse(`
@tables
whatever

@tables-indexes
string-keys
  strID *string
  numSort **number
`)
  inventory = inventoryDefaults()
  indexes = populateTablesIndexes({ arc, inventory })
  t.assert.ok(indexes.length === 1, 'Got correct number of indexes back')
  t.assert.equal(indexes[0].partitionKeyType, 'String', 'Got back correct partition key type')
  t.assert.equal(indexes[0].sortKeyType, 'Number', 'Got back correct sort key type')

  arc = parse(`
@tables
whatever

@tables-indexes
string-keys
  strID *
  strSort **
`)
  inventory = inventoryDefaults()
  indexes = populateTablesIndexes({ arc, inventory })
  t.assert.ok(indexes.length === 1, 'Got correct number of indexes back')
  t.assert.equal(indexes[0].partitionKeyType, 'String', 'Got back correct partition key type')
  t.assert.equal(indexes[0].sortKeyType, 'String', 'Got back correct sort key type')
})

test('@tables-indexes population: validation errors', t => {
  t.plan(12)
  let errors = []
  let inventory = inventoryDefaults()
  function run (str) {
    let arc = parse(str)
    populateTablesIndexes({ arc, inventory, errors })
  }
  function check (str = 'Invalid index errored', qty = 1) {
    t.assert.equal(errors.length, qty, str)
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
  t.assert.equal(errors.length, 0, `Valid indexes did not error`)

  // Errors
  run(`${indexes}hi`)
  check(`Indexes require tables`)

  run(`${tables}${indexes}hello${attr}\nhello${attr}\nhello${attr}`)
  check(`Duplicate indexes errored`)

  run(`${tables}${indexes}hi`)
  check()

  run(`${tables}${indexes}hello
  there`)
  check(undefined, 2)

  run(`${tables}${indexes}hello
  there friend`)
  check(undefined, 2)

  run(`${tables}${indexes}hello
  there **String`)
  check(`Primary keys are required`, 2)

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

test('@tables-indexes: plugin errors', t => {
  t.plan(14)
  let errors = []
  let inventory

  function run (returning, arc) {
    arc = arc || parse(`@tables`)
    inventory = inventoryDefaults()
    inventory.plugins = setterPluginSetup(() => returning)
    populateTablesIndexes({ arc, inventory, errors })
  }
  function check (str = 'Invalid index errored', qty = 1) {
    t.assert.equal(errors.length, qty, str)
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
  t.assert.equal(errors.length, 0, `Valid indexes did not error`)

  // Errors
  run({ name: 'hi', partitionKey, partitionKeyType }, {})
  check(`Indexes require tables`)

  run([
    { name: 'hello', partitionKey, partitionKeyType },
    { name: 'hello', partitionKey, partitionKeyType },
    { name: 'hello', partitionKey, partitionKeyType },
  ])
  check(`Duplicate indexes errored`)

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
  // run(`${tables}${indexes}hello
  // there *string`)
  // check(`Primary key casing matters`, 2)

  run({ name: `hi there!`, partitionKey, partitionKeyType })
  check()

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
