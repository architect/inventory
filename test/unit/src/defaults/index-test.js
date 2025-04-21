let { join } = require('path')
let { readdirSync } = require('node:fs')
let { test } = require('node:test')
let pragmas = require('../../../../src/lib/pragmas')
let inventoryDefaults = require('../../../../src/defaults')
let defaultFunctionConfig = require('../../../../src/defaults/function-config')

let str = s => JSON.stringify(s)

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(inventoryDefaults, 'Inventory defaults module is present')
})

let result = inventoryDefaults()

test('Inventory defaults returns correct default inventory object', t => {
  let pragmaDir = join(process.cwd(), 'src', 'config', 'pragmas')
  let pragmas = readdirSync(pragmaDir)
    .filter(f => f.endsWith('.js') && (f !== 'index.js' && f !== 'src-dirs.js'))
    .map(f => f.replace('.js', ''))
  let inventoryPropSize = pragmas.length + 5 // arc + project + meta (custom-lambdas + lambdaSrcDirs + lambdasBySrcDir)

  t.plan(inventoryPropSize)

  t.assert.equal(Object.keys(result).length, inventoryPropSize, 'Got correct number of properties')
  t.assert.ok(result._arc, 'Got _arc')
  t.assert.ok(result._project, 'Got _project')

  pragmas.forEach(pragma => {
    if (pragma === 'app') t.assert.equal(result.app, '', 'Got app')
    else if (pragma === 'aws') t.assert.ok(result.aws, 'Got aws')
    else t.assert.equal(result[pragma], null, `Got ${pragma}`)
  })

  t.assert.equal(result.lambdaSrcDirs, null, 'Got lambdaSrcDirs')
  t.assert.equal(result.lambdasBySrcDir, null, 'Got lambdasBySrcDir')
})

test('Architect project defaults are pre-populated', t => {
  t.plan(1)
  t.assert.equal(result.aws.region, 'us-west-2', 'Region set by dfeault to us-west-2')
})

test('Inventory got pragma registry', t => {
  t.plan(1)
  t.assert.deepEqual(result._arc.pragmas, pragmas, 'Got full pragma registry')
})

test('Inventory got default function config', t => {
  t.plan(2)
  let defaultConfig = defaultFunctionConfig()
  t.assert.equal(str(result._arc.defaultFunctionConfig), str(defaultConfig), 'Arc got default function config')
  t.assert.equal(str(result._project.defaultFunctionConfig), str(defaultConfig), 'Project got default function config')
})

test('Inventory got proper project keys', t => {
  t.plan(1)
  let keys = [
    'type',
    'cwd',
    'src',
    'build',
    'manifest',
    'preferences',
    'localPreferences',
    'localPreferencesFile',
    'globalPreferences',
    'globalPreferencesFile',
    'defaultFunctionConfig',
    'rootHandler',
    'env',
    'customRuntimes',
    'arc',
    'raw',
  ]
  let project = Object.keys(result._project)
  t.assert.deepEqual(keys.sort(), project.sort(), 'Found all project keys')
})


test('Set Arc deploy stage (if present)', t => {
  t.plan(4)
  let def, deployStage

  def = inventoryDefaults()
  t.assert.equal(def._arc.deployStage, null, 'Unspecified deploy stage returns null')

  deployStage = 'staging'
  def = inventoryDefaults({ deployStage })
  t.assert.equal(def._arc.deployStage, deployStage, `Got correct deployStage: ${deployStage}`)

  deployStage = 'production'
  def = inventoryDefaults({ deployStage })
  t.assert.equal(def._arc.deployStage, deployStage, `Got correct deployStage: ${deployStage}`)

  // We aren't really doing this, but let's look out for it
  deployStage = 'idk'
  def = inventoryDefaults({ deployStage })
  t.assert.equal(def._arc.deployStage, deployStage, `Got correct deployStage: ${deployStage}`)
})
