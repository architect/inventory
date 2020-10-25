let { join } = require('path')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'index')
let inv = require(sut)

let dir = process.cwd()
let defaults = inventoryDefaults()
let mock = join(process.cwd(), 'test', 'mock')
function reset () {
  process.chdir(dir)
}

test('Set up env', t => {
  t.plan(1)
  t.ok(inv, 'Inventory entry is present')
})

test('Inventory an empty project', t => {
  let keys = Object.keys(defaults)
  t.plan((keys.length * 2) + 2)
  let cwd = join(mock, 'empty')
  inv({ cwd }, (err, result) => {
    if (err) t.fail(err)
    else {
      let { inv, get } = result
      t.ok(inv, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      keys.forEach(key => {
        let invFound = inv[key] || inv[key] === null
        let getFound = get[key]
        t.ok(invFound, `Inventory has entry for: ${key}`)
        t.ok(getFound, `Getter has entry for: ${key}`)
      })
      reset()
    }
  })
})

test('Inventory a maxed-out project', t => {
  let keys = Object.keys(defaults)
  t.plan((keys.length * 2) + 2)
  let cwd = join(mock, 'max')
  inv({ cwd }, (err, result) => {
    if (err) t.fail(err)
    else {
      let { inv, get } = result
      t.ok(inv, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      keys.forEach(key => {
        let invFound = inv[key]
        let getFound = get[key]
        t.ok(invFound, `Inventory has entry for: ${key}`)
        t.ok(getFound, `Getter has entry for: ${key}`)
      })
      reset()
    }
  })
})
