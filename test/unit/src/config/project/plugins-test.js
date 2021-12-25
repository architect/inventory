/* let { join, sep } = require('path')
let test = require('tape')
let mockFs = require('mock-fs')
let mockRequire = require('mock-require')
let sut = join(process.cwd(), 'src', 'config', 'project', 'plugins')
let plugins = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(plugins, 'Plugins module is present')
})

test('No plugins returns null', t => {
  t.plan(1)
  let project = { arc: {} }
  let result = plugins(project)
  t.equal(result, null, 'Plugins returned null for project without plugins')
})

test('Check plugin file paths', t => {
  t.plan(14)
  let path = join(sep, 'foo')
  let name = 'proj'
  let localPath = join(path, 'src', 'plugins', `${name}.js`)
  let localPath1 = join(path, 'src', 'plugins', name)
  let modulePath = join(path, 'node_modules', name)
  let modulePath1 = join(path, 'node_modules', `@${name}`)
  mockRequire(localPath, function localPath () {})
  mockRequire(localPath1, function localPath1 () {})
  mockRequire(modulePath, function modulePath () {})
  mockRequire(modulePath1, function modulePath1 () {})

  let project = {
    src: path,
    arc: { plugins: [ 'proj' ] }
  }
  let errors
  let result

  mockFs({ [localPath]: null })
  errors = []
  result = plugins(project, errors)
  t.ok(result[name], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name].name, 'localPath', 'Got back correct plugin: localPath')

  mockFs({ [localPath1]: null })
  result = plugins(project, errors)
  t.ok(result[name], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name].name, 'localPath1', 'Got back correct plugin: localPath1')

  mockFs({ [modulePath]: null })
  result = plugins(project, errors)
  t.ok(result[name], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name].name, 'modulePath', 'Got back correct plugin: modulePath')

  mockFs({ [modulePath1]: null })
  result = plugins(project, errors)
  t.ok(result[name], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name].name, 'modulePath1', 'Got back correct plugin: modulePath1')

  mockFs.restore()
  result = plugins(project, errors)
  t.notOk(result[name], 'Got back no plugins')
  t.equal(errors.length, 1, `Got back an error: ${errors[0]}`)

  mockRequire.stopAll()
})

test('Plugin load failure', t => {
  t.plan(2)
  let path = join(sep, 'foo')
  let name = 'proj'
  let localPath = join(path, 'src', 'plugins', `${name}.js`)

  let project = {
    src: path,
    arc: { plugins: [ 'proj' ] }
  }
  let errors
  let result

  mockFs({ [localPath]: null })
  errors = []
  result = plugins(project, errors)
  t.notOk(result[name], 'Got back no plugins')
  t.equal(errors.length, 1, `Got back an error: ${errors[0]}`)

  mockFs.restore()
})
 */
