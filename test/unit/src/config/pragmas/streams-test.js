let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let mockFs = require('mock-fs')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'streams')
let populateStreams = require(sut)

let cwd = process.cwd()
let inventory = inventoryDefaults()
inventory.project.src = cwd
let tablesDir = join(cwd, 'src', 'tables')
let streamsDir = join(cwd, 'src', 'streams')

let tableNames = [ 'a-table', 'another-table' ]
let streamNames = [ 'a-stream', 'another-stream' ]

test('Set up env', t => {
  t.plan(1)
  t.ok(populateStreams, '@streams Lambda populator is present')
})

test('No @streams returns null', t => {
  t.plan(1)
  t.equal(populateStreams({ arc: {}, inventory }), null, 'Returned null')
})

test('@tables populates @streams: legacy + current source paths', t => {
  t.plan(7)

  mockFs({
    [join(tablesDir, 'a-table')]: {}
  })

  let arc = parse(`
@tables
control # Should not have a stream
  id *String

${tableNames[0]}
  id *String
  stream true

${tableNames[1]}
  id *String
  stream true
`)
  let streams = populateStreams({ arc, inventory })
  mockFs.restore() // Must be restored before any tape tests are resolved because mock-fs#201
  t.equal(streams.length, tableNames.length, 'Got correct number of streams back')
  tableNames.forEach(val => {
    t.ok(streams.some(stream => stream.name === val), `Got stream: ${val}`)
  })
  streams.forEach(stream => {
    let { name, handlerFile, src } = stream
    let dir = name === tableNames[0]
      ? join(tablesDir, name)
      : join(streamsDir, name)
    t.equal(src, dir, `Stream configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('Presence of @tables legacy dir does not impact @streams', t => {
  t.plan(1)

  mockFs({
    [join(tablesDir, 'a-table')]: {}
  })

  let arc = parse(`
@streams
${tableNames[0]}
`)
  let streams = populateStreams({ arc, inventory })
  mockFs.restore() // Must be restored before any tape tests are resolved because mock-fs#201
  streams.forEach(stream => {
    let { name, src } = stream
    t.equal(src, join(streamsDir, name), `Stream configured with correct source dir: ${src}`)
  })
})

test('@streams population: simple format', t => {
  t.plan(7)

  let arc = parse(`
@streams
${tableNames[0]}
${tableNames[1]}
`)
  let streams = populateStreams({ arc, inventory })
  t.equal(streams.length, tableNames.length, 'Got correct number of streams back')
  tableNames.forEach(val => {
    t.ok(streams.some(stream => stream.name === val), `Got stream: ${val}`)
  })
  streams.forEach(stream => {
    let { name, handlerFile, src } = stream
    t.equal(src, join(streamsDir, name), `Stream configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@streams population: complex format', t => {
  t.plan(9)
  let complextableNames = [
    `a-stream
  table ${tableNames[0]}
  src ${streamNames[0]}/path`,
    `another-stream
  table ${tableNames[1]}
  src ${streamNames[1]}/path`
  ]
  let arc = parse(`
@streams
${complextableNames.join('\n')}
`)
  let streams = populateStreams({ arc, inventory })
  t.equal(streams.length, tableNames.length, 'Got correct number of streams back')
  streamNames.forEach(val => {
    t.ok(streams.some(stream => stream.name === val), `Got stream: ${val}`)
  })
  streams.forEach(stream => {
    let { name, handlerFile, src, table } = stream
    if (name === streamNames[0]) t.equal(table, tableNames[0], `Stream associated with correct table: ${tableNames[0]}`)
    if (name === streamNames[1]) t.equal(table, tableNames[1], `Stream associated with correct table: ${tableNames[1]}`)
    t.equal(src, join(cwd, `${name}/path`), `Stream configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(join(cwd, `${name}/path`)), `Handler file is in the correct source dir`)
  })
})

test('@streams population: complex format (default table name)', t => {
  t.plan(9)
  let complextableNames = [
    `a-stream
  src ${streamNames[0]}/path`,
    `another-stream
  src ${streamNames[1]}/path`
  ]
  let arc = parse(`
@streams
${complextableNames.join('\n')}
`)
  let streams = populateStreams({ arc, inventory })
  t.equal(streams.length, tableNames.length, 'Got correct number of streams back')
  streamNames.forEach(val => {
    t.ok(streams.some(stream => stream.name === val), `Got stream: ${val}`)
  })
  streams.forEach(stream => {
    let { name, handlerFile, src, table } = stream
    if (name === streamNames[0]) t.equal(table, streamNames[0], `Stream associated with correct table: ${streamNames[0]}`)
    if (name === streamNames[1]) t.equal(table, streamNames[1], `Stream associated with correct table: ${streamNames[1]}`)
    t.equal(src, join(cwd, `${name}/path`), `Stream configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(join(cwd, `${name}/path`)), `Handler file is in the correct source dir`)
  })
})

test('@streams population: @streams & @tables coexist', t => {
  t.plan(13)
  let arc = parse(`
@tables
${tableNames[0]}
  stream true
${tableNames[1]}
  stream true

@streams
a-stream
  table a-stream
another-stream
  table a-stream
`)
  let streams = populateStreams({ arc, inventory })
  t.equal(streams.length, streamNames.length + tableNames.length, 'Got correct number of streams back')
  streamNames.concat(tableNames).forEach(val => {
    t.ok(streams.some(stream => stream.name === val), `Got stream: ${val}`)
  })
  streams.forEach(stream => {
    let { name, handlerFile, src } = stream
    t.equal(src, join(streamsDir, name), `Stream configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@streams population: invalid streams throw', t => {
  t.plan(1)
  let arc = parse(`
@streams
hi there
`)
  t.throws(() => {
    populateStreams({ arc, inventory })
  }, 'Invalid stream threw')
})
