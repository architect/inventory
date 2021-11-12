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
  let errors = []
  let inventory = {}
  validateTablesChildren(inventory, errors)
  t.equal(errors.length, 0, `No errors reported`)
})

test('Valid table children configuration', t => {
  t.plan(1)
  let errors = []
  let tables = [ { name: 'table' } ]
  let indexes = tables
  let streams = tables.map(({ name }) => ({ name, table: name }))
  let inventory = { tables, streams, indexes }
  validateTablesChildren(inventory, errors)
  t.equal(errors.length, 0, `No errors reported`)
})


test('Tables streams missing a table', t => {
  t.plan(2)
  let errors = []
  let tables = [ { name: 'table' } ]
  let streams = [ { name: 'foo', table: 'foo' } ]
  let inventory = { tables, 'tables-streams': streams }
  validateTablesChildren(inventory, errors)
  t.equal(errors.length, 1, `Got back an error`)
  t.ok(errors[0].includes('@tables-streams foo missing corresponding table'), `Stream missing table returned an error`)
  console.log(errors)
})

test('Indexes missing a table', t => {
  t.plan(2)
  let errors = []
  let tables = [ { name: 'table' } ]
  let indexes = [ { name: 'foo' } ]
  let inventory = { tables, indexes }
  validateTablesChildren(inventory, errors)
  t.equal(errors.length, 1, `Got back an error`)
  t.ok(errors[0].includes('@indexes foo missing corresponding table'), `Index missing table returned an error`)
  console.log(errors)
})

test('Streams + indexes both missing a table', t => {
  t.plan(3)
  let errors = []
  let tables = [ { name: 'table' } ]
  let streams = [ { name: 'foo', table: 'foo' } ]
  let indexes = [ { name: 'foo' } ]
  let inventory = { tables, 'tables-streams': streams, indexes }
  validateTablesChildren(inventory, errors)
  t.equal(errors.length, 2, `Got back errors`)
  t.ok(errors[0].includes('@tables-streams foo missing corresponding table'), `Stream missing table returned an error`)
  t.ok(errors[1].includes('@indexes foo missing corresponding table'), `Index missing table returned an error`)
  console.log(errors)
})
