let { test } = require('node:test')
let mergeEnvVars = require('../../../../src/lib/merge-env-vars')

let hi, yo
function reset () {
  hi = { hi: 'there' }
  yo = { yo: 'friend' }
}

// Run reset before each test
test.beforeEach(reset)

// Initial reset to set up variables
reset()

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(mergeEnvVars, 'mergeEnvVars util is present')
})

test('Do nothing', t => {
  t.plan(2)
  let errors = []
  let result = mergeEnvVars({
    source: null,
    target: null,
    errors,
  })
  t.assert.deepEqual(result, null, 'No source and target envs returned empty env object')
  t.assert.equal(errors.length, 0, 'No errors returned')
})

test('No source returns target', t => {
  t.plan(2)
  let errors = []
  let target = { testing: hi,   staging: hi,    production: hi }
  let result = mergeEnvVars({ source: null, target, errors })
  t.assert.deepEqual(result, target, 'No source returned same target')
  t.assert.equal(errors.length, 0, 'No errors returned')
})

test('No target returns source', t => {
  t.plan(2)
  let errors = []
  let source = { testing: hi,   staging: hi,    production: hi }
  let result = mergeEnvVars({ source, target: null, errors })
  t.assert.deepEqual(result, source, 'No target returned same source')
  t.assert.equal(errors.length, 0, 'No errors returned')
})

// Only testing merges from source into target, as the source is plugins
test('Merge a single target environment', t => {
  t.plan(2)
  let errors = []
  let source = { testing: hi,   staging: hi,    production: hi }
  let target = { testing: yo,   staging: null,  production: null }
  let result = mergeEnvVars({ source, target, errors })
  let expected = {
    testing: { ...hi, ...yo },
    staging: hi,
    production: hi,
  }
  t.assert.deepEqual(result, expected, 'Single environment successfully merged')
  t.assert.equal(errors.length, 0, 'No errors returned')
})

test('Merge of two environments', t => {
  t.plan(2)
  let errors = []
  let source = { testing: hi,   staging: hi,    production: hi }
  let target = { testing: yo,   staging: yo,    production: null }
  let result = mergeEnvVars({ source, target, errors })
  let expected = {
    testing: { ...hi, ...yo },
    staging: { ...hi, ...yo },
    production: hi,
  }
  t.assert.deepEqual(result, expected, 'Two environments successfully merged')
  t.assert.equal(errors.length, 0, 'No errors returned')
})

test('Merge of all environments', t => {
  t.plan(2)
  let errors = []
  let source = { testing: hi,   staging: hi,    production: hi }
  let target = { testing: yo,   staging: yo,    production: yo }
  let result = mergeEnvVars({ source, target, errors })
  let expected = {
    testing: { ...hi, ...yo },
    staging: { ...hi, ...yo },
    production: { ...hi, ...yo },
  }
  t.assert.deepEqual(result, expected, 'All environments successfully merged')
  t.assert.equal(errors.length, 0, 'No errors returned')
})

test('Errors', t => {
  t.plan(2)
  let errors = []
  let source = { testing: hi,   staging: hi,    production: hi }
  let target = { testing: hi,   staging: null,  production: null }
  mergeEnvVars({ source, target, errors })
  t.assert.equal(errors.length, 1, 'No errors returned')
  t.assert.match(errors[0], /conflicts with plugin/, `Got back error: ${errors[0]}`)
})
