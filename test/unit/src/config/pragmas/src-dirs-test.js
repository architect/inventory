let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'src-dirs')
let populateSrcDirs = require(sut)

let str = s => JSON.stringify(s)

test('Set up env', t => {
  t.plan(1)
  t.ok(populateSrcDirs, 'Lambda source directory populator is present')
})

test('No Lambdae returns null', t => {
  t.plan(1)
  t.equal(populateSrcDirs({ pragmas: {} }), null, 'Returned null')
})

test('Lambda source dir population', t => {
  t.plan(2)

  let values = [ 'foo', 'bar', 'fiz', 'buz' ]
  let pragmas = {
    http: [
      { src: values[0] },
      { src: values[1] }
    ],
    events: [
      { src: values[2] },
      { src: values[3] }
    ],
    scheduled: null
  }

  let srcDirs = populateSrcDirs({ pragmas })
  t.equal(srcDirs.length, values.length, 'Got correct number of srcDirs back')
  t.equal(str(srcDirs.sort()), str(values.sort()), 'Got back same source dirs from various pragmas')
})

test('HTTP Arc Static Asset Proxy handler', t => {
  t.plan(1)

  let pragmas = {
    http: [
      {
        name: 'get /*',
        arcStaticAssetProxy: true,
        src: null
      }
    ]
  }

  let srcDirs = populateSrcDirs({ pragmas })
  t.equal(srcDirs, null, 'Got back null srcDirs')
})


test('Lambdas missing src throw', t => {
  t.plan(1)
  let pragmas = {
    http: [
      { name: 'get /' }
    ]
  }

  t.throws(() => {
    populateSrcDirs({ pragmas })
  }, 'Invalid pragma threw')
})
