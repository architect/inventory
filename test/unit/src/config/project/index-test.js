let { join } = require('node:path')
let { test } = require('node:test')
let mockTmp = require('mock-tmp')
let cwd = process.cwd()
let { overrideHomedir } = require('../../../../lib')
let inventoryDefaults = require('../../../../../src/defaults')
let defaultFunctionConfig = require('../../../../../src/defaults/function-config')
let getProjectConfig = require('../../../../../src/config/project')

let mock = join(cwd, 'test', 'mock')
let localPrefsFile = 'prefs.arc'
let globalPrefsFile = '.prefs.arc'

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(getProjectConfig, 'Project constructor is present')
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
  t.assert.equal(errors.length, 0, 'Did not error')
  t.assert.equal(proj.cwd, cwd, 'Populated cwd')
  t.assert.equal(proj.src, join(cwd, 'src'), 'Populated src')
  t.assert.equal(proj.build, null, 'Did not populate build')
  t.assert.equal(proj.manifest, filepath, 'Populated project manifest path')
  t.assert.equal(proj.preferences, null, 'Did not populate preferences')
  t.assert.equal(proj.localPreferences, null, 'Did not populate localPreferences')
  t.assert.equal(proj.localPreferencesFile, null, 'Did not populate localPreferencesFile')
  t.assert.equal(proj.globalPreferences, null, 'Did not populate globalPreferences')
  t.assert.equal(proj.globalPreferencesFile, null, 'Did not populate globalPreferencesFile')
  t.assert.deepEqual(proj.defaultFunctionConfig, defaultFunctionConfig(), 'Populated default function config')
  t.assert.equal(proj.rootHandler, null, 'Did not populate rootHandler')
  t.assert.deepEqual(proj.env, emptyEnv, 'Populated default env object')
  t.assert.equal(proj.customRuntimes, null, 'Did not populate customRuntimes')
  t.assert.deepEqual(proj.arc, arc, 'Populated arc object')
  t.assert.equal(proj.raw, raw, 'Populated raw arc')
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
  t.assert.equal(errors.length, 0, 'Did not error')
  t.assert.deepEqual(proj.defaultFunctionConfig, config, 'Upserted global setting into default function config')
})

test('Project preferences', t => {
  t.plan(29)
  let arc = {}
  let errors = []
  let cwd, inventory, proj, tmp

  // Local preferences only
  cwd = join(mock, 'prefs', 'local')
  inventory = inventoryDefaults({ cwd })
  proj = getProjectConfig({ arc, errors, inventory })
  t.assert.equal(errors.length, 0, 'Did not error')
  t.assert.ok(proj.preferences, 'Populated preferences')
  t.assert.equal(proj.preferences.env.testing.foo, 'bar', 'Populated testing env')
  t.assert.equal(proj.preferences.create.autocreate, true, 'Populated Create prefs')
  t.assert.ok(!proj.preferences.sandbox, 'Did not populate Sandbox prefs')
  t.assert.ok(proj.localPreferences, 'Populated localPreferences')
  t.assert.equal(proj.localPreferencesFile, join(cwd, localPrefsFile), 'Populated localPreferencesFile')
  t.assert.equal(proj.globalPreferences, null, 'Did not populate globalPreferences')
  t.assert.equal(proj.globalPreferencesFile, null, 'Did not populate globalPreferencesFile')
  t.assert.equal(proj.env.local.testing.foo, 'bar', 'Populated env local/testing')

  // Global preferences only
  let globalPrefs = `@env
testing
  fiz buz
@sandbox
useAWS true`
  tmp = mockTmp({
    [globalPrefsFile]: globalPrefs,
  })
  overrideHomedir(tmp)
  inventory = inventoryDefaults({ cwd: process.cwd() })
  proj = getProjectConfig({ arc, errors, inventory })
  t.assert.equal(errors.length, 0, 'Did not error')
  t.assert.ok(proj.preferences, 'Populated preferences')
  t.assert.equal(proj.preferences.env.testing.fiz, 'buz', 'Populated testing env')
  t.assert.equal(proj.preferences.sandbox.useAWS, true, 'Populated Sandbox prefs')
  t.assert.equal(proj.localPreferences, null, 'Did not populate localPreferences')
  t.assert.equal(proj.localPreferencesFile, null, 'Did not populate localPreferencesFile')
  t.assert.ok(proj.globalPreferences, 'Populated globalPreferences')
  t.assert.equal(proj.globalPreferencesFile, join(tmp, globalPrefsFile), 'Populated globalPreferencesFile')
  t.assert.equal(proj.env.local.testing.fiz, 'buz', 'Populated env local/testing')
  mockTmp.reset()

  // Merge local + global preferences
  tmp = mockTmp({
    [globalPrefsFile]: globalPrefs,
  })
  overrideHomedir(tmp)
  inventory = inventoryDefaults({ cwd })
  proj = getProjectConfig({ arc, errors, inventory })
  t.assert.equal(errors.length, 0, 'Did not error')
  t.assert.ok(proj.preferences, 'Populated preferences')
  t.assert.equal(proj.preferences.env.testing.foo, 'bar', 'Populated testing env (preferred local to global prefs)')
  t.assert.equal(proj.preferences.create.autocreate, true, 'Populated Create prefs (from local prefs)')
  t.assert.equal(proj.preferences.sandbox.useAWS, true, 'Populated Sandbox prefs (from global prefs)')
  t.assert.ok(proj.localPreferences, 'Populated localPreferences')
  t.assert.equal(proj.localPreferencesFile, join(cwd, localPrefsFile), 'Populated localPreferencesFile')
  t.assert.ok(proj.globalPreferences, 'Populated globalPreferences')
  t.assert.equal(proj.globalPreferencesFile, join(tmp, globalPrefsFile), 'Populated globalPreferencesFile')
  t.assert.equal(proj.env.local.testing.foo, 'bar', 'Populated env local/testing (preferred local to global prefs)')
  mockTmp.reset()
  overrideHomedir.reset()
})

test('Project plugins', t => {
  t.plan(26)
  let arc = {}
  let errors = []
  let inventory = inventoryDefaults()
  let proj

  // Env + custom runtime plugins
  let env = { henlo: 'friend' }
  let runtime = { name: 'typescript', type: 'transpiled', build: 'dist', baseRuntime: 'nodejs20.x' }
  let plugins = { _methods: { set: {
    env: [ () => (env) ],
    runtimes: [ () => (runtime) ],
  } } }
  inventory.plugins = plugins
  proj = getProjectConfig({ arc, errors, inventory })
  t.assert.equal(errors.length, 0, 'Did not error')
  t.assert.equal(proj.cwd, cwd, 'Populated cwd')
  t.assert.equal(proj.src, join(cwd, 'src'), 'Populated src')
  t.assert.equal(proj.build, join(cwd, 'dist'), 'Populated build')
  t.assert.equal(proj.preferences, null, 'Did not populate preferences')
  t.assert.equal(proj.localPreferences, null, 'Did not populate localPreferences')
  t.assert.equal(proj.localPreferencesFile, null, 'Did not populate localPreferencesFile')
  t.assert.equal(proj.globalPreferences, null, 'Did not populate globalPreferences')
  t.assert.equal(proj.globalPreferencesFile, null, 'Did not populate globalPreferencesFile')
  Object.entries(proj.env.local).forEach(([ e, v ]) => t.assert.deepEqual(v, env, `Populated project env.local.${e} with plugin env`))
  Object.entries(proj.env.plugins).forEach(([ e, v ]) => t.assert.deepEqual(v, env, `Populated project env.plugins.${e} with plugin env`))
  t.assert.equal(proj.env.aws, null, 'Did not populate env aws')
  t.assert.deepEqual(proj.customRuntimes.runtimes, [ 'typescript' ], 'Populated customRuntimes')
  t.assert.deepEqual(proj.customRuntimes.typescript, runtime, 'Populated customRuntime typescript')

  // Local env preferences merged with env plugin
  let localPrefs = `@env
testing
  foo bar`
  cwd = mockTmp({
    [localPrefsFile]: localPrefs,
  })
  inventory = inventoryDefaults({ cwd })
  inventory.plugins = plugins
  proj = getProjectConfig({ arc, errors, inventory })
  t.assert.equal(errors.length, 0, 'Did not error')
  t.assert.deepEqual(proj.env.local.testing, { foo: 'bar', ...env }, `Populated project env.local.testing with merged prefs + plugin env`)
  t.assert.deepEqual(proj.env.local.staging, env, `Populated project env.local.staging with merged prefs + plugin env`)
  t.assert.deepEqual(proj.env.local.production, env, `Populated project env.local.production with merged prefs + plugin env`)
  Object.entries(proj.env.plugins).forEach(([ e, v ]) => t.assert.deepEqual(v, env, `Populated project env.plugins.${e} with plugin env`))
  t.assert.equal(proj.env.aws, null, 'Did not populate env aws')
  mockTmp.reset()

  // Could do some local env + env plugin merge errors, but we can reasonably assume that's covered in `test/unit/src/lib/merge-env-vars-test.js`
})
