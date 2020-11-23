let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'static')
let populateStatic = require(sut)

let str = s => JSON.stringify(s)

test('Set up env', t => {
  t.plan(1)
  t.ok(populateStatic, '@static populator is present')
})

test('No @static returns null', t => {
  t.plan(1)
  t.equal(populateStatic({ arc: {} }), null, 'Returned null')
})

test('@static population via @http', t => {
  t.plan(1)
  let arc = parse(`@http`)
  let _static = populateStatic({ arc })
  t.equal(Object.keys(_static).length, 8, 'Returned correct number of settings')
})

test('@static returns all known defaults or null values', t => {
  t.plan(2)
  let mock = {
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
  let _static = populateStatic({ arc })
  t.equal(Object.keys(_static).length, 8, 'Returned correct number of settings')
  t.equal(str(_static), str(mock), 'Returned all known keys')
})

test('Individual @static setting: fingerprint', t => {
  t.plan(2)
  let setting = 'fingerprint'
  let value
  let arc
  let _static

  value = true
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)

  value = false
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: folder', t => {
  t.plan(1)
  let setting = 'folder'
  let value = 'some-folder'
  let arc = parse(`
@static
${setting} ${value}
`)
  let _static = populateStatic({ arc })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: ignore', t => {
  t.plan(3)
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
  _static = populateStatic({ arc })
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
  _static = populateStatic({ arc })
  t.equal(str(_static[setting]), str(values), `Returned correct ${setting} setting: ${str(values)}`)

  values = [ 'some-filename' ]
  arc = parse(`
@static
${setting} ${values[0]}
  `)
  _static = populateStatic({ arc })
  t.equal(str(_static[setting]), str(values), `Returned correct ${setting} setting: ${str(values)}`)
})

test('Individual @static setting: prefix', t => {
  t.plan(1)
  let setting = 'prefix'
  let value = 'some-prefix'
  let arc = parse(`
@static
${setting} ${value}
`)
  let _static = populateStatic({ arc })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: prune', t => {
  t.plan(2)
  let setting = 'prune'
  let value
  let arc
  let _static

  value = true
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)

  value = false
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: spa', t => {
  t.plan(2)
  let setting = 'spa'
  let value
  let arc
  let _static

  value = true
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)

  value = false
  arc = parse(`
@static
${setting} ${value}
`)
  _static = populateStatic({ arc })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: staging', t => {
  t.plan(1)
  let setting = 'staging'
  let value = 'staging-bucket'
  let arc = parse(`
@static
${setting} ${value}
`)
  let _static = populateStatic({ arc })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})

test('Individual @static setting: production', t => {
  t.plan(1)
  let setting = 'production'
  let value = 'production-bucket'
  let arc = parse(`
@static
${setting} ${value}
`)
  let _static = populateStatic({ arc })
  t.equal(_static[setting], value, `Returned correct ${setting} setting: ${value}`)
})
