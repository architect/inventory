let { join } = require('path')
let mockFs = require('mock-fs')
let parse = require('@architect/parser')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'streams')
let populateStreams = require(sut)

let cwd = process.cwd()
let inventory = inventoryDefaults()
inventory._project.src = cwd
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
  mockFs.restore()
})

test('Presence of @tables legacy dir does not impact @streams', t => {
  t.plan(1)

  mockFs({
    [join(tablesDir, 'a-table')]: {}
  })

  let arc = parse(`
@tables
${tableNames[0]}
@streams
${tableNames[0]}
`)
  let streams = populateStreams({ arc, inventory })
  streams.forEach(stream => {
    let { name, src } = stream
    t.equal(src, join(streamsDir, name), `Stream configured with correct source dir: ${src}`)
  })
  mockFs.restore()
})

test('@streams population: simple format', t => {
  t.plan(7)

  let arc = parse(`
@tables
${tableNames[0]}
${tableNames[1]}
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
@tables
${tableNames[0]}
${tableNames[1]}
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
@tables
${tableNames[0]}
${tableNames[1]}
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

test('@streams population: validation errors', t => {
  t.plan(9)
  let errors = []
  function run (str) {
    let arc = parse(str)
    populateStreams({ arc, inventory, errors })
  }
  function check (str = 'Invalid stream errored', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }
  let streams = `@streams\n`
  let tables = `@tables\n`

  // Controls
  run(`${tables}hello\n${streams}hello`)
  run(`${tables}hello\n  stream true`)
  run(`${tables}hello-there\n${streams}hello-there`)
  run(`${tables}hello-there\n  stream true`)
  run(`${tables}hello.there\n${streams}hello.there`)
  run(`${tables}hello.there\n  stream true`)
  run(`${tables}helloThere\n${streams}helloThere`)
  run(`${tables}helloThere\n  stream true`)
  run(`${tables}h3llo_there\n${streams}h3llo_there`)
  run(`${tables}h3llo_there\n  stream true`)
  // Overlapping but ultimately the same, so we'll allow it I guess?
  run(`@tables
hello
  stream true
@streams
hello`)
  // These two are funky, but not specifying table in complex format defaults to the stream name
  run(`${tables}hello\n${streams}hello\n  there`)
  run(`${tables}hello\n${streams}hello\n  friend table`)
  t.equal(errors.length, 0, `Valid tables did not error`)

  // Errors
  run(`${streams}hi`)
  check(`Streams require tables`)

  run(`${tables}hello\n${streams}hello\nhello`)
  check(`Duplicate streams errored`)

  run(`${tables}hello
  stream true
hello
  stream true`)
  check(`Duplicate streams errored`)

  run(`${tables}hello
${streams}hello
  table foo
hello
  table bar`)
  check(`Similarly duplicate streams errored`)

  run(`${tables}hello\n${streams}hi`)
  check()

  run(`${tables}hello\n${streams}hi there`)
  check()

  run(`${tables}hello\n${streams}hi-there!`)
  check()

  let name = Array.from(Array(130), () => 'hi').join('')
  run(`${tables}${name}\n${streams}${name}`)
  check()
})
