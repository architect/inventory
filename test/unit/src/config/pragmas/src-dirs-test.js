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
  t.plan(2)
  let { lambdaSrcDirs, lambdasBySrcDir } = populateSrcDirs({ pragmas: {} })
  t.equal(lambdaSrcDirs, null, 'Returned null lambdaSrcDirs')
  t.equal(lambdasBySrcDir, null, 'Returned null lambdasBySrcDir')
})

test('Lambda source dir population', t => {
  t.plan(4)

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

  let { lambdaSrcDirs, lambdasBySrcDir } = populateSrcDirs({ pragmas })
  t.equal(lambdaSrcDirs.length, values.length, 'Got correct number of lambdaSrcDirs back')
  t.equal(Object.keys(lambdasBySrcDir).length, values.length, 'Got correct number of lambdasBySrcDir params back')
  t.equal(str(lambdaSrcDirs.sort()), str(values.sort()), 'Got back same source dirs from various pragmas in lambdaSrcDirs')
  t.equal(str(Object.keys(lambdasBySrcDir).sort()), str(values.sort()), 'Got back same source dirs from various pragmas in lambdasBySrcDir')
})

test('Multiple Lambdas mapped to the same source dir', t => {
  t.plan(9)

  let values = [ 'foo', 'bar', 'fiz' ]
  let pragmas = {
    http: [
      { src: values[0] },
      { src: values[0] },
      { src: values[0] },
      { src: values[1] },
    ],
    events: [
      { src: values[2] }
    ]
  }

  let { lambdaSrcDirs, lambdasBySrcDir } = populateSrcDirs({ pragmas })
  t.equal(lambdaSrcDirs.length, values.length, 'Got correct number of (deduped) lambdaSrcDirs back')
  t.equal(Object.keys(lambdasBySrcDir).length, values.length, 'Got correct number of lambdasBySrcDir back')

  values.forEach(dir => {
    if (dir === values[0]) {
      t.ok(Array.isArray(lambdasBySrcDir[dir]), 'Got array of multitenant Lambdae back')
      t.equal(lambdasBySrcDir[dir].length, 3, 'Got correct number of multitenant Lambdae back')
      lambdasBySrcDir[dir].forEach(l => {
        t.ok((l.src === values[0]) && (l.pragma === 'http'), 'Multitenant Lambda params identify the same dir')
      })
    }
    else t.equal(lambdasBySrcDir[dir].src, dir, 'Got normal Lambda back')
  })
})

test('HTTP Arc Static Asset Proxy handler', t => {
  t.plan(2)

  let pragmas = {
    http: [
      {
        name: 'get /*',
        arcStaticAssetProxy: true,
        src: null
      }
    ]
  }

  let { lambdaSrcDirs, lambdasBySrcDir } = populateSrcDirs({ pragmas })
  t.equal(lambdaSrcDirs, null, 'Returned null lambdaSrcDirs')
  t.equal(lambdasBySrcDir, null, 'Returned null lambdasBySrcDir')
})


test('Lambdas missing src errors', t => {
  t.plan(1)
  let pragmas = {
    http: [
      { name: 'get /' }
    ]
  }
  let errors = []
  populateSrcDirs({ pragmas, errors })
  t.ok(errors.length, 'Invalid pragma errored')
})
