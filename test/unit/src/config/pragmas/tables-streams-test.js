let { join } = require('path')
let mockFs = require('mock-fs')
let parse = require('@architect/parser')
let test = require('tape')
let cwd = process.cwd()
let inventoryDefaultsPath = join(cwd, 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let testLibPath = join(cwd, 'test', 'lib')
let testLib = require(testLibPath)
let sut = join(cwd, 'src', 'config', 'pragmas', 'tables-streams')
let populateTablesStreams = require(sut)

let inventory = inventoryDefaults()
inventory._project.src = cwd
let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'tables-streams')

let tablesDir = join(cwd, 'src', 'tables')
let streamsDir = join(cwd, 'src', 'streams')
let tablesStreamsDir = join(cwd, 'src', 'tables-streams')

let tableNames = [ 'a-table', 'another-table', 'yet-another-table' ]
let streamNames = [ 'a-stream', 'another-stream', 'yet-another-stream' ]

test('Set up env', t => {
  t.plan(1)
  t.ok(populateTablesStreams, '@tables-streams Lambda populator is present')
})

test('No @tables-streams returns null', t => {
  t.plan(1)
  t.equal(populateTablesStreams({ arc: {}, inventory }), null, 'Returned null')
})

test('@tables without @tables-streams returns null', t => {
  t.plan(1)
  t.equal(populateTablesStreams({ arc: { tables: [ 'a-table' ] }, inventory }), null, 'Returned null')
})

test('@tables populates @tables-streams: legacy + current source paths', t => {
  t.plan(10)

  mockFs({
    [join(tablesDir, tableNames[0])]: {},
    [join(streamsDir, tableNames[1])]: {},
    [join(tablesStreamsDir, tableNames[2])]: {},
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

${tableNames[2]}
  id *String
  stream true
`)
  let streams = populateTablesStreams({ arc, inventory })
  t.equal(streams.length, tableNames.length, 'Got correct number of tables-streams back')
  tableNames.forEach(val => {
    t.ok(streams.some(stream => stream.name === val), `Got stream: ${val}`)
  })
  streams.forEach(stream => {
    let { name, handlerFile, src } = stream
    let dir = name === tableNames[0] && join(tablesDir, name) ||
              name === tableNames[1] && join(streamsDir, name) ||
              name === tableNames[2] && join(tablesStreamsDir, name)
    t.equal(src, dir, `Stream configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
  mockFs.restore()
})

test('Presence of @tables legacy dir does not impact @tables-streams', t => {
  t.plan(1)

  mockFs({
    [join(tablesDir, 'a-table')]: {}
  })

  let arc = parse(`
@tables
${tableNames[0]}
@tables-streams
${tableNames[0]}
`)
  let streams = populateTablesStreams({ arc, inventory })
  streams.forEach(stream => {
    let { name, src } = stream
    t.equal(src, join(tablesStreamsDir, name), `Stream configured with correct source dir: ${src}`)
  })
  mockFs.restore()
})

test('@tables-streams population: simple format', t => {
  t.plan(10)

  let arc = parse(`
@tables
${tableNames[0]}
${tableNames[1]}
${tableNames[2]}
@tables-streams
${tableNames[0]}
${tableNames[1]}
${tableNames[2]}
`)
  let streams = populateTablesStreams({ arc, inventory })
  t.equal(streams.length, tableNames.length, 'Got correct number of tables-streams back')
  tableNames.forEach(val => {
    t.ok(streams.some(stream => stream.name === val), `Got stream: ${val}`)
  })
  streams.forEach(stream => {
    let { name, handlerFile, src } = stream
    t.equal(src, join(tablesStreamsDir, name), `Stream configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@tables-streams population: complex format', t => {
  t.plan(12)
  let complextableNames = [
    `a-stream
  table ${tableNames[0]}
  src ${streamNames[0]}/path`,
    `another-stream
  table ${tableNames[1]}
  src ${streamNames[1]}/path`,
    `yet-another-stream
  table ${tableNames[2]}
  src ${streamNames[2]}/path`,
  ]
  let arc = parse(`
@tables
${tableNames[0]}
${tableNames[1]}
${tableNames[2]}
@tables-streams
${complextableNames.join('\n')}
`)
  let streams = populateTablesStreams({ arc, inventory })
  t.equal(streams.length, tableNames.length, 'Got correct number of tables-streams back')
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

test('@tables-streams population: complex format (default table name)', t => {
  t.plan(12)
  let complextableNames = [
    `a-stream
  src ${streamNames[0]}/path`,
    `another-stream
  src ${streamNames[1]}/path`,
    `yet-another-stream
  src ${streamNames[2]}/path`,
  ]
  let arc = parse(`
@tables
${tableNames[0]}
${tableNames[1]}
${tableNames[2]}
@tables-streams
${complextableNames.join('\n')}
`)
  let streams = populateTablesStreams({ arc, inventory })
  t.equal(streams.length, tableNames.length, 'Got correct number of tables-streams back')
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

test('@tables-streams population: @tables-streams & @tables coexist', t => {
  t.plan(19)
  let arc = parse(`
@tables
${tableNames[0]}
  stream true
${tableNames[1]}
  stream true
${tableNames[2]}
  stream true

@tables-streams
a-stream
  table a-stream
another-stream
  table a-stream
yet-another-stream
  table a-stream
`)
  let streams = populateTablesStreams({ arc, inventory })
  t.equal(streams.length, streamNames.length + tableNames.length, 'Got correct number of tables-streams back')
  streamNames.concat(tableNames).forEach(val => {
    t.ok(streams.some(stream => stream.name === val), `Got stream: ${val}`)
  })
  streams.forEach(stream => {
    let { name, handlerFile, src } = stream
    t.equal(src, join(tablesStreamsDir, name), `Stream configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@tables-streams population: plugin setter', t => {
  t.plan(10)

  let arc = parse(`
@tables
${tableNames[0]}
${tableNames[1]}
${tableNames[2]}
`)
  let inventory = inventoryDefaults()
  inventory._project.src = cwd
  let setter = () => tableNames.map(v => ({ name: v, table: v, src: join(tablesStreamsDir, v) }))
  inventory.plugins = setterPluginSetup(setter)

  let streams = populateTablesStreams({ arc, inventory })
  t.equal(streams.length, tableNames.length, 'Got correct number of tables-streams back')
  tableNames.forEach(val => {
    t.ok(streams.some(stream => stream.name === val), `Got stream: ${val}`)
  })
  streams.forEach(stream => {
    let { name, handlerFile, src } = stream
    t.equal(src, join(tablesStreamsDir, name), `Stream configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@tables-streams population: validation errors', t => {
  t.plan(9)
  let errors = []
  function run (str) {
    let arc = parse(str)
    populateTablesStreams({ arc, inventory, errors })
  }
  function check (str = 'Invalid stream errored', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }
  let tables = `@tables\n`
  let tablesStreams = `@tables-streams\n`

  // Controls
  run(`${tables}hello\n${tablesStreams}hello`)
  run(`${tables}hello\n  stream true`)
  run(`${tables}hello-there\n${tablesStreams}hello-there`)
  run(`${tables}hello-there\n  stream true`)
  run(`${tables}hello.there\n${tablesStreams}hello.there`)
  run(`${tables}hello.there\n  stream true`)
  run(`${tables}helloThere\n${tablesStreams}helloThere`)
  run(`${tables}helloThere\n  stream true`)
  run(`${tables}h3llo_there\n${tablesStreams}h3llo_there`)
  run(`${tables}h3llo_there\n  stream true`)
  // Overlapping but ultimately the same, so we'll allow it I guess?
  run(`@tables
hello
  stream true
@tables-streams
hello`)
  // These two are funky, but not specifying table in complex format defaults to the stream name
  run(`${tables}hello\n${tablesStreams}hello\n  there`)
  run(`${tables}hello\n${tablesStreams}hello\n  friend table`)
  t.equal(errors.length, 0, `Valid tables did not error`)

  // Errors
  run(`${tablesStreams}hi`)
  check(`Streams require tables`)

  run(`${tables}hello\n${tablesStreams}hello\nhello`)
  check(`Duplicate tables-streams errored`)

  run(`${tables}hello
  stream true
hello
  stream true`)
  check(`Duplicate tables-streams errored`)

  run(`${tables}hello
${tablesStreams}hello
  table foo
hello
  table bar`)
  check(`Similarly duplicate tables-streams errored`)

  run(`${tables}hello\n${tablesStreams}hi`)
  check()

  run(`${tables}hello\n${tablesStreams}hi there`)
  check()

  run(`${tables}hello\n${tablesStreams}hi-there!`)
  check()

  let name = Array.from(Array(130), () => 'hi').join('')
  run(`${tables}${name}\n${tablesStreams}${name}`)
  check()
})

test('@tables-streams population: plugin errors', t => {
  t.plan(8)
  let errors = []
  function run (returning) {
    let inventory = inventoryDefaults()
    inventory._project.src = cwd
    inventory.plugins = setterPluginSetup(() => returning)
    let arc = { tables: [ { hi: {} } ] }
    populateTablesStreams({ arc, inventory, errors })
  }
  function check (str = 'Invalid setter return', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Control
  run({ name: 'hello', table: 'hello', src: 'hi' })
  t.equal(errors.length, 0, `Valid routes did not error`)

  // Errors
  run()
  check()

  run({})
  check()

  run({ name: 'hello' })
  check()

  run({ table: 'hello' })
  check()

  run({ src: 'hi' })
  check()

  run({ name: 'hello', src: 'hi' })
  check()

  run({ table: 'hello', src: 'hi' })
  check()
})
