let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'read')
let read = require(sut)
let mockFs = require('mock-fs')
let cwd = process.cwd()

// Mock data – super stripped down, this isn't to validate parser compat
// Manifest mock data
let basicArcObj = { app: [ 'appname' ] }
// Config mock data
let basicConfigObj = { aws: [ [ 'runtime', 42 ] ] }
// Architect preference files
let basicPrefsObj = { env: [ { testing: { FOO: 'bar' } } ] }

function check (params, file) {
  let { t, text, obj, type, subset } = params
  mockFs({ [file]: text })
  let { arc, raw, filepath } = read({ type, cwd })
  mockFs.restore()
  t.deepEqual(arc, obj, 'Returned Arc object:')
  console.log(arc)
  // Subset used for extracting Arc from an existing manifest (like package.json)
  t.equal(raw, subset ? subset : text, 'Returned raw text:')
  console.log(raw)
  t.equal(filepath, join(cwd, file), `Returned filepath:`)
  console.log(filepath)
}

test('Set up env', t => {
  t.plan(1)
  t.ok(read, 'Reader is present')
})

test('Read core Architect manifests', t => {
  let arcs = [ 'app.arc', '.arc' ]
  let configs = [ 'config.arc', '.arc-config' ]
  let prefs = [ 'preferences.arc', 'prefs.arc' ]
  t.plan(arcs.concat(configs, prefs).length * 3)
  let text
  let type

  // Core Architect manifests
  text = '@app\nappname'
  type = 'projectManifest'
  arcs.forEach(check.bind({}, { t, text, obj: basicArcObj, type }))

  // Architect config files
  text = '@aws\nruntime 42'
  type = 'functionConfig'
  configs.forEach(check.bind({}, { t, text, obj: basicConfigObj, type }))

  // Architect preference files
  text = '@env\ntesting\n  FOO bar'
  type = 'preferences'
  prefs.forEach(check.bind({}, { t, text, obj: basicPrefsObj, type }))
})

test('Read Architect JSON manifests', t => {
  let arcs = [ 'arc.json' ]
  let configs = [ 'arc.json', 'arc-config.json' ]
  // TODO impl prefs when support is added
  t.plan(arcs.concat(configs).length * 3)
  let text
  let type

  // Core Architect manifests
  text = JSON.stringify({ app: 'appname' })
  type = 'projectManifest'
  arcs.forEach(check.bind({}, { t, text, obj: basicArcObj, type }))

  // Architect config files
  text = JSON.stringify({ aws: { runtime: 42 } })
  type = 'functionConfig'
  configs.forEach(check.bind({}, { t, text, obj: basicConfigObj, type }))

  /*
  // Architect preference files
  text = JSON.stringify({ env: { testing: { FOO: 'bar' } } })
  type = 'preferences'
  prefs.forEach(check.bind({}, {t, text, obj: basicPrefsObj, type}))
  */
})

test('Read Architect YAML manifests', t => {
  let arcs = [ 'arc.yaml', 'arc.yml' ]
  let configs = [ 'config.yaml', 'config.yml', 'arc-config.yaml', 'arc-config.yml' ]
  // TODO impl prefs when support is added
  t.plan(arcs.concat(configs).length * 3)
  let text
  let type

  // Core Architect manifests
  text = 'app: appname'
  type = 'projectManifest'
  arcs.forEach(check.bind({}, { t, text, obj: basicArcObj, type }))

  // Architect config files
  text = 'aws:\n  runtime: 42'
  type = 'functionConfig'
  configs.forEach(check.bind({}, { t, text, obj: basicConfigObj, type }))

  /*
  // Architect preference files
  text = 'env:\n  testing:\n    FOO bar'
  type = 'preferences'
  prefs.forEach(check.bind({}, {t, text, obj: basicPrefsObj, type}))
  */
})

test('Read Architect TOML manifests', t => {
  let arcs = [ 'arc.toml' ]
  let configs = [ 'config.toml', 'arc-config.toml' ]
  // TODO impl prefs when support is added
  t.plan(arcs.concat(configs).length * 3)
  let text
  let type

  // Core Architect manifests
  text = 'app="appname"'
  type = 'projectManifest'
  arcs.forEach(check.bind({}, { t, text, obj: basicArcObj, type }))

  // Architect config files
  text = `[aws]\nruntime=42`
  type = 'functionConfig'
  configs.forEach(check.bind({}, { t, text, obj: basicConfigObj, type }))

  /*
  // Architect preference files
  text = 'blergtomllol'
  type = 'preferences'
  prefs.forEach(check.bind({}, {t, text, obj: basicPrefsObj, type}))
  */
})

test('Read Architect embedded in existing manifests', t => {
  let arcs = [ 'package.json' ]
  t.plan(arcs.length * 3)
  let text
  let type
  let subset

  let arc = { app: 'appname' }
  text = JSON.stringify({
    name: 'some-project',
    version: '1.0.0',
    description: 'You know, just some project',
    arc
  })
  subset = JSON.stringify(arc, null, 2)
  type = 'projectManifest'

  arcs.forEach(check.bind({}, { t, text, obj: basicArcObj, type, subset }))
})


test('Graceful reader failures', t => {
  t.plan(10)

  function thrower () {
    try {
      read({ type: 'projectManifest', cwd })
      t.fail('Expected an error')
    }
    catch (err) {
      mockFs.restore()
      t.pass(err, 'Threw error on invalid Architect manifest')
    }
  }

  // Invalid files
  mockFs({ 'app.arc': 'lol' })
  thrower()
  mockFs({ 'arc.json': 'lol' })
  thrower()
  mockFs({ 'arc.yaml': `'lol` })
  thrower()
  mockFs({ 'arc.toml': 'lol' })
  thrower()
  mockFs({ 'package.json': 'lol' })
  thrower()

  // Empty files
  let empty = '\n \n'
  mockFs({ 'app.arc': empty })
  mockFs({ 'app.arc': empty })
  thrower()
  mockFs({ 'arc.json': empty })
  thrower()
  mockFs({ 'arc.yaml': empty })
  thrower()
  mockFs({ 'arc.toml': empty })
  thrower()
  mockFs({ 'package.json': empty })
  thrower()
})
