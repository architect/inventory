let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'tables')
let populateTables = require(sut)

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
  t.plan(14)

  let arc = parse(`
@tables
string-keys
  strID *String
  strSort **String
  stream true
  _ttl TTL
  PointInTimeRecovery true
  encrypt true
  legacy true
  insert Lambda # Legacy param (ignored)
  update Lambda # Legacy param (ignored)
  delete Lambda # Legacy param (ignored)
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
  t.equal(tables[0].PointInTimeRecovery, true, 'Got back correct PointInTimeRecovery value')
  t.equal(tables[0].encrypt, true, 'Got back correct encrypt value')
  t.equal(tables[0].legacy, true, 'Got back correct legacy value')
  t.equal(tables[0].insert, undefined, 'Skipped deprecated insert Lambda setting')
  t.equal(tables[0].update, undefined, 'Skipped deprecated update Lambda setting')
  t.equal(tables[0].delete, undefined, 'Skipped deprecated delete Lambda setting')
})

test('@tables population: invalid tables throw', t => {
  t.plan(1)
  let arc = parse(`
@tables
hi there
`)
  t.throws(() => {
    populateTables({ arc })
  }, 'Invalid table threw')
})
