let { join } = require('path')
let mockFs = require('mock-fs')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'read')
let read = require(sut)
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
  t.deepEqual(arc, obj, 'Returned Arc object')
  // Subset used for extracting Arc from an existing manifest (like package.json)
  t.equal(raw, subset ? subset : text, 'Returned raw text')
  t.equal(filepath, join(cwd, file), `Returned filepath`)
  mockFs.restore()
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
  t.plan(arcs.length * 7)
  let text
  let type
  let subset

  let arc = { app: 'appname' }
  let proj = {
    name: 'some-project',
    version: '1.0.0',
    description: 'You know, just some project',
  }
  type = 'projectManifest'
  subset = JSON.stringify(arc, null, 2)

  text = JSON.stringify({ ...proj, arc })
  arcs.forEach(check.bind({}, { t, text, obj: basicArcObj, type, subset }))

  text = JSON.stringify({ ...proj, architect: arc })
  arcs.forEach(check.bind({}, { t, text, obj: basicArcObj, type, subset }))

  text = JSON.stringify(proj)
  mockFs({ [arcs[0]]: text })
  let result = read({ type, cwd })
  t.notEqual(result.arc.app, arc.app, 'Did not return arc')
  mockFs.restore()
})


test('Reader errors', t => {
  t.plan(11)

  let file
  let type
  function go () {
    let errors = []
    read({ type: 'projectManifest', cwd, errors })
    t.equal(errors.length, 1, `Got reader error: ${type} ${file}`)
    mockFs.restore()
  }

  // Invalid reader type
  t.throws(() => {
    read({ type: 'idk', cwd, errors: [] })
  }, 'Invalid reader type throws')

  // Invalid files
  type = 'invalid'
  file = 'app.arc'
  mockFs({ [file]: 'lol' })
  go()

  file = 'arc.json'
  mockFs({ [file]: 'lol' })
  go()

  file = 'arc.yaml'
  mockFs({ [file]: `'lol` })
  go()

  file = 'arc.toml'
  mockFs({ [file]: 'lol' })
  go()

  file = 'package.json'
  mockFs({ [file]: 'lol' })
  go()

  // Empty files
  type = 'empty'
  file = 'app.arc'
  let empty = '\n \n'
  mockFs({ [file]: empty })
  go()

  file = 'arc.json'
  mockFs({ [file]: empty })
  go()

  file = 'arc.yaml'
  mockFs({ [file]: empty })
  go()

  file = 'arc.toml'
  mockFs({ [file]: empty })
  go()

  file = 'package.json'
  mockFs({ [file]: empty })
  go()

})
