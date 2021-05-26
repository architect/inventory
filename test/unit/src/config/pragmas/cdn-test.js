let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'cdn')
let populateCDN = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(populateCDN, '@cdn populator is present')
})

test('No @http + no @cdn returns null @cdn', t => {
  t.plan(1)
  t.equal(populateCDN({ arc: {} }), null, 'Returned null')
})

test('@cdn population', t => {
  t.plan(5)

  let arc
  let cdn
  arc = parse(`@http\n@cdn`)
  cdn = populateCDN({ arc })
  t.equal(cdn, true, '@cdn enabled')

  arc = parse(`@http\n@cdn\ntrue`)
  cdn = populateCDN({ arc })
  t.equal(cdn, true, '@cdn enabled explicitly')

  arc = parse(`@http\n@cdn\nfalse`)
  cdn = populateCDN({ arc })
  t.equal(cdn, false, `@cdn disabled with 'false'`)

  arc = parse(`@http\n@cdn\ndisable`)
  cdn = populateCDN({ arc })
  t.equal(cdn, false, `@cdn disabled with 'disable'`)

  arc = parse(`@http\n@cdn\ndisabled`)
  cdn = populateCDN({ arc })
  t.equal(cdn, false, `@cdn disabled with 'disabled'`)
})

test('@cdn errors', t => {
  t.plan(1)
  let errors = []
  populateCDN({ arc: { cdn: true }, errors })
  t.ok(errors.length, '@cdn without @http errored')
})
