let { join } = require('path')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'validate', 'paths')
let validatePaths = require(sut)

let errors = []
let defaults = inventoryDefaults()
let reset = () => {
  if (errors[0]) console.log(errors[0])
  defaults = inventoryDefaults()
  errors = []
}

test('Set up env', t => {
  t.plan(1)
  t.ok(validatePaths, 'File paths validator is present')
})

test('Do nothing', t => {
  t.plan(1)
  validatePaths(defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  t.teardown(reset)
})

test('Valid paths', t => {
  t.plan(5)

  defaults._project.cwd = '/foo'
  validatePaths(defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  defaults._project.src = '/foo/src'
  validatePaths(defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  defaults._project.build = '/foo/build'
  validatePaths(defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  defaults.lambdasBySrcDir = [ { src: '/foo/lambda' } ]
  validatePaths(defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  defaults._project.cwd = '/~why/!hello/`there/@strange/#path/$name'
  validatePaths(defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  t.teardown(reset)
})

test('Invalid paths', t => {
  t.plan(8)

  defaults._project.cwd = '/füü'
  validatePaths(defaults, errors)
  t.equal(errors.length, 1, `Error reported (project path)`)
  t.match(errors[0], /Project file path/, `Error reported relates to project path`)
  reset()

  defaults._project.src = '/füü/src'
  validatePaths(defaults, errors)
  t.equal(errors.length, 1, `Error reported (project source path)`)
  t.match(errors[0], /Project source path/, `Error reported relates to project source path`)
  reset()

  defaults._project.build = '/füü/build'
  validatePaths(defaults, errors)
  t.equal(errors.length, 1, `Error reported (build path)`)
  t.match(errors[0], /Build path/, `Error reported relates to build path`)
  reset()

  defaults.lambdasBySrcDir = [ { src: '/füü/lambda', name: 'get /füü', pragma: 'http' } ]
  validatePaths(defaults, errors)
  t.equal(errors.length, 1, `Error reported (Lambda path)`)
  t.match(errors[0], /@http get \/füü source/, `Error reported relates to Lambda path`)

  t.teardown(reset)
})
