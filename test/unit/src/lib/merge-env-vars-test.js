let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'lib', 'merge-env-vars')
let mergeEnvVars = require(sut)

let hi, yo
function reset () {
  hi = { hi: 'there' }
  yo = { yo: 'friend' }
}
reset()

test('Set up env', t => {
  t.plan(1)
  t.ok(mergeEnvVars, 'mergeEnvVars util is present')
})

test('Do nothing', t => {
  t.plan(2)
  let errors = []
  let result = mergeEnvVars({
    source: null,
    target: null,
    errors
  })
  t.deepEqual(result, null, 'No source and target envs returned empty env object')
  t.equal(errors.length, 0, 'No errors returned')
  t.teardown(reset)
})

test('No source returns target', t => {
  t.plan(2)
  let errors = []
  let target = { testing: hi,   staging: hi,    production: hi }
  let result = mergeEnvVars({ source: null, target, errors })
  t.deepEqual(result, target, 'No source returned same target')
  t.equal(errors.length, 0, 'No errors returned')
  t.teardown(reset)
})

test('No target returns source', t => {
  t.plan(2)
  let errors = []
  let source = { testing: hi,   staging: hi,    production: hi }
  let result = mergeEnvVars({ source, target: null, errors })
  t.deepEqual(result, source, 'No target returned same source')
  t.equal(errors.length, 0, 'No errors returned')
  t.teardown(reset)
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
  t.deepEqual(result, expected, 'Single environment successfully merged')
  t.equal(errors.length, 0, 'No errors returned')
  t.teardown(reset)
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
  t.deepEqual(result, expected, 'Two environments successfully merged')
  t.equal(errors.length, 0, 'No errors returned')
  t.teardown(reset)
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
  t.deepEqual(result, expected, 'All environments successfully merged')
  t.equal(errors.length, 0, 'No errors returned')
  t.teardown(reset)
})

test('Errors', t => {
  t.plan(2)
  let errors = []
  let source = { testing: hi,   staging: hi,    production: hi }
  let target = { testing: hi,   staging: null,  production: null }
  mergeEnvVars({ source, target, errors })
  t.equal(errors.length, 1, 'No errors returned')
  t.match(errors[0], /conflicts with plugin/, `Got back error: ${errors[0]}`)
  t.teardown(reset)
})
