let { is } = require('./lib')

module.exports = function _get (inventory) {
  function getter (prag, name) {
    let pragma = inventory[prag]

    // Getters
    if (pragma === null) return null
    if (is.array(pragma)) {
      // Handle arrays of named entities or string values
      let finder = i => i?.name === name || i === name
      if (multipleResults.includes(prag)) {
        let results = pragma.filter(finder)
        return results.length ? results : undefined
      }
      return pragma.find(finder)
    }
    else if (is.object(pragma)) {
      return pragma[name]
    }
    else if (is.string(pragma) && !name) {
      return pragma
    }
    else if (is.bool(pragma) && !name) {
      return pragma
    }
    return undefined // jic
  }

  let get = {}
  Object.keys(inventory).forEach(pragma => {
    get[pragma] = getter.bind({}, pragma)
  })
  return get
}

// Everything is uniquely named except in certain special-case pragmas
// These refer to other pragmas, and thus may allow multiple same/same-named entities
let multipleResults = [
  'tables-indexes',
]
