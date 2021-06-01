let { join } = require('path')
let test = require('tape')
let mockFs = require('mock-fs')
let sut = join(process.cwd(), 'src', 'lib', 'asap-src')
let asapSrc = require(sut)
let cwd = process.cwd()

test('Set up env', t => {
  t.plan(1)
  t.ok(asapSrc, 'ASAP src util is present')
})

test('Get ASAP', t => {
  t.plan(4)
  // Since we're developing Inventory locally (a scenario that bumps into asapSrc's business logic)
  // Temporarily change the src dir via cwd to prevent collisions
  // Work the src dir order backwards to test
  process.chdir(__dirname)
  let asap

  mockFs({})
  t.throws(() => {
    asapSrc()
  }, 'Throw if unable to find ASAP module')

  let localPath = join(cwd, 'node_modules', '@architect', 'asap', 'dist')
  mockFs({ [localPath]: 'ok' })
  asap = asapSrc()
  t.equal(asap, localPath, `Got ASAP module in local dev mode: ${asap}`)

  process.chdir(cwd)
  let globalPath = join(cwd, '..', 'asap', 'dist')
  mockFs({ [globalPath]: 'ok' })
  asap = asapSrc()
  t.equal(asap, globalPath, `Got ASAP module in global mode: ${asap}`)

  mockFs.restore()
  process.chdir(cwd) // Restore again, looks to be a mockFs restore bug mutating cwd
  let src = localPath // It's ok, this is the known collision when working locally
  asap = asapSrc()
  t.equal(asap, src, `Got ASAP module as a normal dependency: ${asap}`)
})
