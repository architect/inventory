let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let cwd = process.cwd()
let inventoryDefaultsPath = join(cwd, 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let testLibPath = join(cwd, 'test', 'lib')
let testLib = require(testLibPath)
let sut = join(cwd, 'src', 'config', 'pragmas', 'static')
let populateStatic = require(sut)

let inventory
function reset () {
  inventory = inventoryDefaults()
  inventory._project.cwd = cwd
}
let str = s => JSON.stringify(s)
let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'static')

test('Set up env', t => {
  t.plan(1)
  t.ok(populateStatic, '@static populator is present')
})

test('No @static returns null', t => {
  t.plan(1)
  t.equal(populateStatic({ arc: {}, inventory: {} }), null, 'Returned null')
})

test('@static can be disabled', t => {
  t.plan(1)
  reset()
  let arc
  let _static

  arc = parse(`@static\nfalse`)
  _static = populateStatic({ arc, inventory })
  t.equal(_static, false, 'Static is disabled')
})

test('@static population via @http', t => {
  t.plan(3)
  reset()
  let arc = parse(`@http`)
  let _static = populateStatic({ arc, inventory })
  t.equal(Object.keys(_static).length, 9, 'Returned correct number of settings')
  t.notOk(inventory._project.rootHandler, '_project.rootHandler not set')
  t.notOk(inventory._project.asapSrc, '_project.asapSrc not set')
})

test('@static returns all known defaults or null values', t => {
  t.plan(4)
  reset()
  let mock = {
    compression: false,
    fingerprint: null,
    folder: 'public',
    ignore: null,
    prefix: null,
    prune: null,
    spa: false,
    staging: null,
    production: null,
  }
  let arc = parse(`
@static
idk whatev
`)
  let _static = populateStatic({ arc, inventory })
  t.equal(Object.keys(_static).length, 9, 'Returned correct number of settings')
  t.equal(str(_static), str(mock), 'Returned all known keys')
  t.equal(inventory._project.rootHandler, 'arcStaticAssetProxy', '_project.rootHandler set')
  t.ok(inventory._project.asapSrc, '_project.asapSrc set')
})

test('Individual @static setting: fingerprint', t => {
  t.plan(2)
  reset()
  let setting = 'fingerprint'
  let value
  let arc
  let _static

  value = true
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc, inventory })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)

  value = false
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc, inventory })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: folder', t => {
  t.plan(1)
  reset()
  let setting = 'folder'
  let value = 'some-folder'
  let arc = parse(`
@static
${setting} ${value}
`)
  let _static = populateStatic({ arc, inventory })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: ignore', t => {
  t.plan(3)
  reset()
  let setting = 'ignore'
  let values
  let arc
  let _static

  /**
   * Multiple ignore values
   */
  values = [ 'some-filename', 'some-other-filename' ]
  arc = parse(`
@static
${setting}
  ${values.join('\n  ')}
`)
  _static = populateStatic({ arc, inventory })
  t.equal(str(_static[setting]), str(values), `Returned correct ${setting} setting: ${str(values)}`)

  /**
   * Single ignore value
   */
  values = [ 'some-filename' ]
  arc = parse(`
@static
${setting}
  ${values[0]}
`)
  _static = populateStatic({ arc, inventory })
  t.equal(str(_static[setting]), str(values), `Returned correct ${setting} setting: ${str(values)}`)

  arc = parse(`
@static
${setting} ${values[0]}
  `)
  _static = populateStatic({ arc, inventory })
  t.equal(str(_static[setting]), str(values), `Returned correct ${setting} setting: ${str(values)}`)
})

test('Individual @static setting: ignore merged by plugin + userland arc', t => {
  t.plan(3)
  reset()
  let setting = 'ignore'
  let values = [ 'some-filename', 'some-other-filename' ]
  let arc
  let _static
  let valid
  let setter = () => ({
    ignore: [ 'some-filename' ]
  })

  /**
   * Arc, no plugin
   */
  arc = parse(`
@static
${setting}
  ${values[1]}
`)
  _static = populateStatic({ arc, inventory })
  valid = values.slice(1)
  t.equal(str(_static[setting]), str(valid), `Returned correct ${setting} setting: ${str(valid)}`)

  /**
   * Plugin, no arc
   */
  arc = parse(`
@static`)
  inventory.plugins = setterPluginSetup(setter)
  _static = populateStatic({ arc, inventory })
  valid = values.slice(0, 1)
  t.equal(str(_static[setting]), str(valid), `Returned correct ${setting} setting: ${str(valid)}`)

  /**
   * Arc + plugin merged
   */
  arc = parse(`
@static
${setting}
  ${values[1]}
`)
  _static = populateStatic({ arc, inventory })
  t.equal(str(_static[setting]), str(values), `Returned correct ${setting} setting: ${str(values)}`)
})

test('Individual @static setting: prefix', t => {
  t.plan(1)
  reset()
  let setting = 'prefix'
  let value = 'some-prefix'
  let arc = parse(`
@static
${setting} ${value}
`)
  let _static = populateStatic({ arc, inventory })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: prune', t => {
  t.plan(2)
  reset()
  let setting = 'prune'
  let value
  let arc
  let _static

  value = true
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc, inventory })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)

  value = false
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc, inventory })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: spa', t => {
  t.plan(2)
  reset()
  let setting = 'spa'
  let value
  let arc
  let _static

  value = true
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc, inventory })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)

  value = false
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc, inventory })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: staging', t => {
  t.plan(1)
  reset()
  let setting = 'staging'
  let value = 'staging-bucket'
  let arc = parse(`
@static
${setting} ${value}
`)
  let _static = populateStatic({ arc, inventory })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: production', t => {
  t.plan(1)
  reset()
  let setting = 'production'
  let value = 'production-bucket'
  let arc = parse(`
@static
${setting} ${value}
`)
  let _static = populateStatic({ arc, inventory })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('@static population: validation errors', t => {
  t.plan(10)
  let errors = []
  function run (str) {
    reset()
    let arc = parse(`@http\n@static\n${str}`)
    populateStatic({ arc, inventory, errors })
  }
  function check (str = 'Invalid setting errored', qty = 1) {
    t.equal(errors.length, qty, str)
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Controls (fyi: folder is tested elsewhere)
  run(`compression false`)
  run(`compression true`)
  run(`compression br`)
  run(`compression gzip`)
  run(`fingerprint false`)
  run(`fingerprint true`)
  run(`fingerprint external`)
  run(`ignore lol`)
  run(`ignore lol idk`)
  run(`ignore
  lol`)
  run(`ignore
  lol
  idk`)
  run(`prefix lol`)
  run(`prune false`)
  run(`prune true`)
  run(`spa false`)
  run(`spa true`)
  run(`staging lol`)
  run(`production idk`)
  t.equal(errors.length, 0, `Valid settings did not error`)

  // Errors
  run(`compression deflate`)
  check(`Invalid compression errored`)

  run(`fingerprint lol`)
  check()

  run(`ignore true`)
  check()

  run(`ignore
  lol idk`)
  check()

  run(`prefix true`)
  check()

  run(`prune lol`)
  check()

  run(`spa lol`)
  check()

  run(`staging true`)
  check()

  run(`production false`)
  check()
})

test('@static population: plugin errors', t => {
  t.plan(10)
  let errors = []
  function run (returning) {
    let inventory = inventoryDefaults()
    inventory.plugins = setterPluginSetup(() => returning)
    populateStatic({ arc: {}, inventory, errors })
  }
  function check (str = 'Invalid setting errored', qty = 1) {
    t.equal(errors.length, qty, str)
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Controls (fyi: folder is tested elsewhere)
  run({})
  run({ compression: true })
  run({ compression: 'br' })
  run({ compression: 'gzip' })
  run({ fingerprint: false })
  run({ fingerprint: true })
  run({ fingerprint: 'external' })
  run({ ignore: [ 'lol' ] })
  run({ ignore: [ 'lol', 'idk' ] })
  run({ prefix: 'lol' })
  run({ prune: false })
  run({ prune: true })
  run({ spa: false })
  run({ spa: true })
  run({ staging: 'lol' })
  run({ production: 'idk' })
  t.equal(errors.length, 0, `Valid settings did not error`)

  // Errors
  run({ compression: 'deflate' })
  check(`Invalid compression errored`)

  run({ fingerprint: 'lol' })
  check()

  run({ ignore: true })
  check()

  run({ ignore: { lol: 'idk' } })
  check()

  run({ prefix: true })
  check()

  run({ prune: 'lol' })
  check()

  run({ spa: 'lol' })
  check()

  run({ staging: true })
  check()

  run({ production: false })
  check()
})
