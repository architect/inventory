let { join } = require('path')
let { readdirSync } = require('fs')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(sut)
let defaultFunctionConfig = require(join(sut, 'function-config'))

let str = s => JSON.stringify(s)

test('Set up env', t => {
  t.plan(1)
  t.ok(inventoryDefaults, 'Inventory defaults module is present')
})

let result = inventoryDefaults()

test('Inventory defaults returns correct default inventory object', t => {
  let pragmaDir = join(process.cwd(), 'src', 'config', 'pragmas')
  let pragmas = readdirSync(pragmaDir)
    .filter(f => f.endsWith('.js') && (f !== 'index.js' && f !== 'src-dirs.js'))
    .map(f => f.replace('.js', ''))
  let inventoryParamSize = pragmas.length + 3 // arc + project + lambdaSrcDirs

  t.plan(inventoryParamSize + 1)

  t.equal(Object.keys(result).length, inventoryParamSize, 'Got correct number of params')
  t.ok(result._arc, 'Got arc')
  t.ok(result._project, 'Got project')
  t.equal(result.lambdaSrcDirs, null, 'Got lambdaSrcDirs')

  pragmas.forEach(pragma => {
    if (pragma === 'app') t.equal(result.app, '', 'Got app')
    else if (pragma === 'aws') t.ok(result.aws, 'Got aws')
    else t.equal(result[pragma], null, `Got ${pragma}`)
  })
})

test('Architect project defaults are pre-populated', t => {
  t.plan(1)
  t.equal(result.aws.region, 'us-west-2', 'Region set by dfeault to us-west-2')
})

test('Inventory got default function config', t => {
  t.plan(2)
  let defaultConfig = defaultFunctionConfig()
  t.equal(str(result._arc.defaultFunctionConfig), str(defaultConfig), 'Arc got default function config')
  t.equal(str(result._project.defaultFunctionConfig), str(defaultConfig), 'Project got default function config')
})
