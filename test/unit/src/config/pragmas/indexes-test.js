let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'indexes')
let populateIndexes = require(sut)

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

test('@indexes population: invalid indexes throw', t => {
  t.plan(2)
  let arc

  arc = parse(`
@indexes
hi there
`)
  t.throws(() => {
    populateIndexes({ arc })
  }, 'Invalid index threw')

  arc = parse(`
@indexes
an-index
  something invalid
`)
  t.throws(() => {
    populateIndexes({ arc })
  }, 'Invalid index threw')
})
