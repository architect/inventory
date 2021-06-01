let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'validate', 'tables-children')
let validateTablesChildren = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(validateTablesChildren, 'Table children validator is present')
})

test('Do nothing', t => {
  t.plan(1)
  let inventory = {}
  validateTablesChildren(inventory, err => {
    if (err) t.fail(err)
    t.pass('Did nothing')
  })
})

test('Valid table children configuration', t => {
  t.plan(1)
  let tables = [ { name: 'table' } ]
  let indexes = tables
  let streams = tables.map(({ name }) => ({ name, table: name }))
  let inventory = { tables, streams, indexes }
  validateTablesChildren(inventory, err => {
    if (err) t.fail(err)
    t.pass('No errors returned')
  })
})


test('Streams missing a table', t => {
  t.plan(1)
  let tables = [ { name: 'table' } ]
  let streams = [ { name: 'foo', table: 'foo' } ]
  let inventory = { tables, streams }
  validateTablesChildren(inventory, err => {
    if (!err) t.fail('Expected an error')
    t.ok(err.message.includes('@streams foo missing corresponding table'), `Stream missing table returned an error`)
    console.log(err.message)
  })
})

test('Indexes missing a table', t => {
  t.plan(1)
  let tables = [ { name: 'table' } ]
  let indexes = [ { name: 'foo' } ]
  let inventory = { tables, indexes }
  validateTablesChildren(inventory, err => {
    if (!err) t.fail('Expected an error')
    t.ok(err.message.includes('@indexes foo missing corresponding table'), `Index missing table returned an error`)
    console.log(err.message)
  })
})

test('Streams + indexes both missing a table', t => {
  t.plan(2)
  let tables = [ { name: 'table' } ]
  let streams = [ { name: 'foo', table: 'foo' } ]
  let indexes = [ { name: 'foo' } ]
  let inventory = { tables, streams, indexes }
  validateTablesChildren(inventory, err => {
    if (!err) t.fail('Expected an error')
    t.ok(err.message.includes('@streams foo missing corresponding table'), `Stream missing table returned an error`)
    t.ok(err.message.includes('@indexes foo missing corresponding table'), `Index missing table returned an error`)
    console.log(err.message)
  })
})
