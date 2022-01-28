let { join } = require('path')
let { homedir } = require('os')
let test = require('tape')
let mockFs = require('mock-fs')
let cwd = process.cwd()
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let defaultFunctionConfigPath = join(process.cwd(), 'src', 'defaults', 'function-config')
let defaultFunctionConfig = require(defaultFunctionConfigPath)
let sut = join(cwd, 'src', 'config', 'project')
let getProjectConfig = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(getProjectConfig, 'Project constructor is present')
})

test('Basic project runthrough', t => {
  t.plan(16)
  let arc = {}
  let errors = []
  let raw = '@app\nhi'
  let filepath = join(cwd, 'app.arc')
  let inventory = inventoryDefaults()
  let emptyEnv = { local: null, plugins: null, aws: null }

  let proj = getProjectConfig({ arc, errors, raw, filepath, inventory })
  t.equal(errors.length, 0, 'Did not error')
  t.equal(proj.cwd, cwd, 'Populated cwd')
  t.equal(proj.src, join(cwd, 'src'), 'Populated src')
  t.equal(proj.build, null, 'Did not populate build')
  t.equal(proj.manifest, filepath, 'Populated project manifest path')
  t.equal(proj.preferences, null, 'Did not populate preferences')
  t.equal(proj.localPreferences, null, 'Did not populate localPreferences')
  t.equal(proj.localPreferencesFile, null, 'Did not populate localPreferencesFile')
  t.equal(proj.globalPreferences, null, 'Did not populate globalPreferences')
  t.equal(proj.globalPreferencesFile, null, 'Did not populate globalPreferencesFile')
  t.deepEqual(proj.defaultFunctionConfig, defaultFunctionConfig(), 'Populated default function config')
  t.equal(proj.rootHandler, null, 'Did not populate rootHandler')
  t.deepEqual(proj.env, emptyEnv, 'Populated default env object')
  t.equal(proj.customRuntimes, null, 'Did not populate customRuntimes')
  t.deepEqual(proj.arc, arc, 'Populated arc object')
  t.equal(proj.raw, raw, 'Populated raw arc')
})

test('Project global config upsert', t => {
  t.plan(2)
  let py = 'python3.9'
  let arc = { aws: [ [ 'runtime', py ] ] }
  let errors = []
  let inventory = inventoryDefaults()
  let config = defaultFunctionConfig()
  config.runtime = py

  let proj = getProjectConfig({ arc, errors, inventory })
  t.equal(errors.length, 0, 'Did not error')
  t.deepEqual(proj.defaultFunctionConfig, config, 'Upserted global setting into default function config')
})

test('Project preferences', t => {
  t.plan(29)
  let arc = {}
  let errors = []
  let inventory = inventoryDefaults()
  let proj

  // Local preferences only
  let localPrefs = `@env
testing
  foo bar
@create
autocreate true`
  let localPrefsFile = join(cwd, 'prefs.arc')
  mockFs({
    [localPrefsFile]: localPrefs
  })
  proj = getProjectConfig({ arc, errors, inventory })
  t.equal(errors.length, 0, 'Did not error')
  t.ok(proj.preferences, 'Populated preferences')
  t.equal(proj.preferences.env.testing.foo, 'bar', 'Populated testing env')
  t.equal(proj.preferences.create.autocreate, true, 'Populated Create prefs')
  t.notOk(proj.preferences.sandbox, 'Did not populate Sandbox prefs')
  t.ok(proj.localPreferences, 'Populated localPreferences')
  t.equal(proj.localPreferencesFile, localPrefsFile, 'Populated localPreferencesFile')
  t.equal(proj.globalPreferences, null, 'Did not populate globalPreferences')
  t.equal(proj.globalPreferencesFile, null, 'Did not populate globalPreferencesFile')
  t.equal(proj.env.local.testing.foo, 'bar', 'Populated env local/testing')
  mockFs.restore()

  // Global preferences only
  let globalPrefs = `@env
testing
  fiz buz
@sandbox
useAWS true`
  let globalPrefsFile = join(homedir(), 'prefs.arc')
  mockFs({
    [globalPrefsFile]: globalPrefs
  })
  proj = getProjectConfig({ arc, errors, inventory })
  t.equal(errors.length, 0, 'Did not error')
  t.ok(proj.preferences, 'Populated preferences')
  t.equal(proj.preferences.env.testing.fiz, 'buz', 'Populated testing env')
  t.equal(proj.preferences.sandbox.useAWS, true, 'Populated Sandbox prefs')
  t.equal(proj.localPreferences, null, 'Did not populate localPreferences')
  t.equal(proj.localPreferencesFile, null, 'Did not populate localPreferencesFile')
  t.ok(proj.globalPreferences, 'Populated globalPreferences')
  t.equal(proj.globalPreferencesFile, globalPrefsFile, 'Populated globalPreferencesFile')
  t.equal(proj.env.local.testing.fiz, 'buz', 'Populated env local/testing')
  mockFs.restore()

  // Merge local + global preferences
  mockFs({
    [localPrefsFile]: localPrefs,
    [globalPrefsFile]: globalPrefs,
  })
  proj = getProjectConfig({ arc, errors, inventory })
  t.equal(errors.length, 0, 'Did not error')
  t.ok(proj.preferences, 'Populated preferences')
  t.equal(proj.preferences.env.testing.foo, 'bar', 'Populated testing env (preferred local to global prefs)')
  t.equal(proj.preferences.create.autocreate, true, 'Populated Create prefs (from local prefs)')
  t.equal(proj.preferences.sandbox.useAWS, true, 'Populated Sandbox prefs (from global prefs)')
  t.ok(proj.localPreferences, 'Populated localPreferences')
  t.equal(proj.localPreferencesFile, localPrefsFile, 'Populated localPreferencesFile')
  t.ok(proj.globalPreferences, 'Populated globalPreferences')
  t.equal(proj.globalPreferencesFile, globalPrefsFile, 'Populated globalPreferencesFile')
  t.equal(proj.env.local.testing.foo, 'bar', 'Populated env local/testing (preferred local to global prefs)')
  mockFs.restore()
})

test('Project plugins', t => {
  t.plan(26)
  let arc = {}
  let errors = []
  let inventory = inventoryDefaults()
  let proj

  // Env + custom runtime plugins
  let env = { henlo: 'friend' }
  let runtime = { name: 'typescript', type: 'transpiled', build: 'dist', baseRuntime: 'nodejs14.x' }
  inventory.plugins = { _methods: { set: {
    env: [ () => (env) ],
    runtimes: [ () => (runtime) ],
  } } }
  proj = getProjectConfig({ arc, errors, inventory })
  t.equal(errors.length, 0, 'Did not error')
  t.equal(proj.cwd, cwd, 'Populated cwd')
  t.equal(proj.src, join(cwd, 'src'), 'Populated src')
  t.equal(proj.build, join(cwd, 'dist'), 'Populated build')
  t.equal(proj.preferences, null, 'Did not populate preferences')
  t.equal(proj.localPreferences, null, 'Did not populate localPreferences')
  t.equal(proj.localPreferencesFile, null, 'Did not populate localPreferencesFile')
  t.equal(proj.globalPreferences, null, 'Did not populate globalPreferences')
  t.equal(proj.globalPreferencesFile, null, 'Did not populate globalPreferencesFile')
  Object.entries(proj.env.local).forEach(([ e, v ]) => t.deepEqual(v, env, `Populated project env.local.${e} with plugin env`))
  Object.entries(proj.env.plugins).forEach(([ e, v ]) => t.deepEqual(v, env, `Populated project env.plugins.${e} with plugin env`))
  t.equal(proj.env.aws, null, 'Did not populate env aws')
  t.deepEqual(proj.customRuntimes.runtimes, [ 'typescript' ], 'Populated customRuntimes')
  t.deepEqual(proj.customRuntimes.typescript, runtime, 'Populated customRuntime typescript')

  // Local env preferences merged with env plugin
  let localPrefs = `@env
testing
  foo bar`
  let localPrefsFile = join(cwd, 'prefs.arc')
  mockFs({
    [localPrefsFile]: localPrefs
  })
  proj = getProjectConfig({ arc, errors, inventory })
  t.equal(errors.length, 0, 'Did not error')
  t.deepEqual(proj.env.local.testing, { foo: 'bar', ...env }, `Populated project env.local.testing with merged prefs + plugin env`)
  t.deepEqual(proj.env.local.staging, env, `Populated project env.local.staging with merged prefs + plugin env`)
  t.deepEqual(proj.env.local.production, env, `Populated project env.local.production with merged prefs + plugin env`)
  Object.entries(proj.env.plugins).forEach(([ e, v ]) => t.deepEqual(v, env, `Populated project env.plugins.${e} with plugin env`))
  t.equal(proj.env.aws, null, 'Did not populate env aws')
  mockFs.restore()

  // Could do some local env + env plugin merge errors, but we can reasonably assume that's covered in `test/unit/src/lib/merge-env-vars-test.js`
})
