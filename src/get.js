module.exports = function _get (inventory) {
  function getter (pragma, name) {
    let isType = type => typeof inventory[pragma] === type
    if (inventory[pragma] === null) return null
    if (Array.isArray(inventory[pragma])) {
      return inventory[pragma].find(i => {
        // Handle arrays of named entities
        if (i.name) return i.name === name
        // Handle arrays of string values
        return i === name
      })
    }
    else if (isType('object')) {
      return inventory[pragma][name]
    }
    else if (isType('string') && !name) {
      return inventory[pragma]
    }
    return undefined // jic
  }

  let get = {}
  Object.keys(inventory).forEach(pragma => {
    get[pragma] = getter.bind({}, pragma)
  })
  return get
}
