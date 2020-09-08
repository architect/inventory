module.exports = function _get (inventory) {
  function getter (prag, name) {
    let pragma = inventory[prag]
    let isType = type => typeof pragma === type

    // Getters
    if (pragma === null) return null
    if (Array.isArray(pragma)) {
      return pragma.find(i => {
        // Handle arrays of named entities
        if (i.name) return i.name === name
        // Handle arrays of string values
        return i === name
      })
    }
    else if (isType('object')) {
      return pragma[name]
    }
    else if (isType('string') && !name) {
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
