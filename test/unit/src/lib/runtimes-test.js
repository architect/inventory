let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'lib', 'runtimes')
let runtimes = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(runtimes, 'Runtimes util is present')
})

test('Friendly runtime names', t => {
  t.plan(7)
  let result

  result = runtimes('Node.js')
  t.match(result, /nodejs1[02468]\.x/, 'Shortcut returned valid AWS Node.js string')

  result = runtimes('Python')
  t.match(result, /python3\.\d/, 'Shortcut returned valid AWS Python string')

  result = runtimes('ruby')
  t.match(result, /ruby2\.\d/, 'Shortcut returned valid AWS Ruby string')

  result = runtimes('java')
  t.match(result, /java\d/, 'Shortcut returned valid AWS Java string')

  result = runtimes('golang')
  t.match(result, /go\d\.x/, 'Shortcut returned valid AWS Go string')

  result = runtimes('.net')
  t.match(result, /dotnetcore\d\.\d/, 'Shortcut returned valid AWS .NET string')

  result = runtimes('custom')
  t.match(result, /provided/, 'Shortcut returned valid AWS custom runtime string')
})

test('Exact runtime names', t => {
  t.plan(7)
  let name
  let result

  name = 'nodejs14.x'
  result = runtimes(name)
  t.equal(result, name, `Returned correct runtime string: ${name}`)

  name = 'python3.9'
  result = runtimes(name)
  t.equal(result, name, `Returned correct runtime string: ${name}`)

  name = 'ruby2.7'
  result = runtimes(name)
  t.equal(result, name, `Returned correct runtime string: ${name}`)

  name = 'java11'
  result = runtimes(name)
  t.equal(result, name, `Returned correct runtime string: ${name}`)

  name = 'go1.x'
  result = runtimes(name)
  t.equal(result, name, `Returned correct runtime string: ${name}`)

  name = 'dotnetcore3.1'
  result = runtimes(name)
  t.equal(result, name, `Returned correct runtime string: ${name}`)

  name = 'provided.al2'
  result = runtimes(name)
  t.equal(result, name, `Returned correct runtime string: ${name}`)
})

test('Invalid runtime', t => {
  t.plan(4)
  let name
  let result

  result = runtimes()
  t.equal(result, undefined, 'Did not return')

  name = 1
  result = runtimes(name)
  t.equal(result, undefined, 'Did not return')

  name = {}
  result = runtimes(name)
  t.equal(result, undefined, 'Did not return')

  name = 'fail'
  result = runtimes(name)
  t.equal(result, name, 'Returned bad runtime for later validation')
})
