let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'lib', 'get-lambda-dirs')
let getLambdaDirs = require(sut)

let cwd = 'foo'
let type = 'http'
let projSrc = join(cwd, 'src')
let projBuild = join(cwd, '.build')
let name = 'get-going'
let plugin = true
let customLambdaSrc = name => join('whatev', name)

test('Set up env', t => {
  t.plan(1)
  t.ok(getLambdaDirs, 'getLambdaDirs util is present')
})

test('Get dirs for pragma-defined Lambdas', t => {
  t.plan(10)
  let dirs

  // Just a normal Lambda
  dirs = getLambdaDirs(
    { cwd, projSrc, type, },
    { name, },
  )
  t.equal(Object.keys(dirs).length, 1, 'Only back a single Lambda dir')
  t.equal(dirs.src, join(projSrc, type, name), 'Got back the correct src dir')

  // A Lambda with a custom src property
  dirs = getLambdaDirs(
    { cwd, projSrc, type, },
    { name, customSrc: customLambdaSrc(name) },
  )
  t.equal(Object.keys(dirs).length, 1, 'Only back a single Lambda dir')
  t.equal(dirs.src, join(cwd, 'whatev', name), 'Got back the correct custom src dir')

  // A normal transpiled Lambda
  dirs = getLambdaDirs(
    { cwd, projSrc, projBuild, type, },
    { name },
  )
  t.equal(Object.keys(dirs).length, 2, 'Only back two Lambda dirs')
  t.equal(dirs.src, join(projSrc, type, name), 'Got back the correct src dir')
  t.equal(dirs.build, join(projBuild, type, name), 'Got back the correct build dir')

  // A normal transpiled Lambda with a custom src property
  dirs = getLambdaDirs(
    { cwd, projSrc, projBuild, type, },
    { name, customSrc: customLambdaSrc(name) },
  )
  t.equal(Object.keys(dirs).length, 2, 'Only back two Lambda dirs')
  t.equal(dirs.src, join(cwd, 'whatev', name), 'Got back the correct custom src dir')
  t.equal(dirs.build, join(projBuild, 'whatev', name), 'Got back the correct build dir')
})

test('Get dirs for plugin-defined Lambdas', t => {
  t.plan(10)
  let dirs, item

  // Just a normal plugin Lambda
  item = { src: customLambdaSrc(name) }
  dirs = getLambdaDirs(
    { cwd, item, projSrc, type, },
    { name, plugin, },
  )
  t.equal(Object.keys(dirs).length, 1, 'Only back a single Lambda dir')
  t.equal(dirs.src, join(cwd, 'whatev', name), 'Got back the correct plugin src dir')

  // Just a normal plugin Lambda returning an absolute dir
  item = { src: join(__dirname, cwd, customLambdaSrc(name)) }
  dirs = getLambdaDirs(
    { cwd, item, projSrc, type, },
    { name, plugin, },
  )
  t.equal(Object.keys(dirs).length, 1, 'Only back a single Lambda dir')
  t.equal(dirs.src, join(__dirname, cwd, 'whatev', name), 'Got back the correct plugin src dir')

  // A normal transpiled Lambda
  item = { src: customLambdaSrc(name) }
  dirs = getLambdaDirs(
    { cwd, item, projSrc, projBuild, type, },
    { name, plugin, },
  )
  t.equal(Object.keys(dirs).length, 2, 'Only back two Lambda dirs')
  t.equal(dirs.src, join(cwd, 'whatev', name), 'Got back the correct plugin src dir')
  t.equal(dirs.build, join(projBuild, 'whatev', name), 'Got back the correct plugin build dir')

  // A normal transpiled Lambda returning an absolute dir
  item = { src: join(__dirname, cwd, customLambdaSrc(name)) }
  dirs = getLambdaDirs(
    { cwd, item, projSrc, projBuild, type, },
    { name, plugin, },
  )
  t.equal(Object.keys(dirs).length, 2, 'Only back two Lambda dirs')
  t.equal(dirs.src, join(__dirname, cwd, 'whatev', name), 'Got back the correct plugin src dir')
  t.equal(dirs.build, join(__dirname, projBuild, 'whatev', name), 'Got back the correct plugin build dir')
})
