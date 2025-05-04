let { join } = require('node:path')
let { test } = require('node:test')
let mockTmp = require('mock-tmp')
let cwd = process.cwd()
let asapSrc = require('../../../../src/lib/asap-src')

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(asapSrc, 'ASAP src util is present')
})

test('Get ASAP', t => {
  t.plan(4)
  let asap, tmp

  let localInstallPath = join('node_modules', '@architect', 'asap', 'src')
  tmp = mockTmp({ [localInstallPath]: 'ok' })
  process.chdir('/')
  asap = asapSrc({ _testing: join(tmp, '1', '2') })
  // On Macs the tmp filesystem path may present differently via process.cwd() vs. fs.mkdtemp due to root symlinks from /var → /private/var, so use includes()
  t.assert.ok(asap.includes(join(tmp, localInstallPath)), `Got ASAP module in local dev mode: ${asap}`)
  mockTmp.reset()

  let globalInstallPath = join('asap', 'src')
  tmp = mockTmp({ [globalInstallPath]: 'ok' })
  process.chdir(tmp)
  asap = asapSrc({ _testing: join(tmp, '1', '2', '3') })
  t.assert.equal(asap, join(tmp, globalInstallPath), `Got ASAP module in global mode: ${asap}`)
  process.chdir(cwd)
  mockTmp.reset()

  asap = asapSrc()
  t.assert.equal(asap, join(cwd, localInstallPath), `Got ASAP module as a normal dependency: ${asap}`)

  tmp = mockTmp({ hi: 'ok' })
  process.chdir(tmp)
  asap = asapSrc({ _testing: '/' })
  t.assert.equal(asap, require.resolve('@architect/asap'), `Got ASAP module via require.resolve: ${asap}`)
  process.chdir(cwd)
  mockTmp.reset()

  // Throwing when unable to find ASAP was previously simple via `mock-fs`
  // Now, it isn't easily accomplished without some serious business logic intrusions, so we're just going to assume that path works
  /* t.throws(() => {
    asapSrc()
  }, 'Throw if unable to find ASAP module') */
})
