let { is, validationPatterns } = require('../../../lib')

function regex (value, pattern, pragmaName, errors) {
  if (!validationPatterns[pattern]) throw ReferenceError(`Invalid validation pattern specified: ${pattern}`)
  if (!validationPatterns[pattern].test(value)) errors.push(`Invalid ${pragmaName} item: '${value}' must match ${validationPatterns[pattern]}`)
}

function size (value, min, max, pragmaName, errors) {
  if (!is.string(value)) {
    errors.push(`Invalid ${pragmaName} item: '${value}' must be a string`)
  }
  if (!is.number(min) || !is.number(max)) {
    throw ReferenceError('Invalid size specified')
  }
  if (value.length < min) {
    errors.push(`Invalid ${pragmaName} item: '${value}' must be greater than ${min} characters`)
  }
  if (value.length > max) {
    errors.push(`Invalid ${pragmaName} item: '${value}' must be less than ${max} characters`)
  }
}

function unique (lambdas, pragmaName, errors) {
  if (!is.array(lambdas)) throw ReferenceError(`Invalid Lambda array: ${lambdas}`)
  let names = []        // List of names we've looked at
  let namesErrored = [] // List of any offending names
  if (lambdas.length) lambdas.forEach(({ name, pragma }) => {
    if (names.includes(name) && !namesErrored.includes(name)) {
      let err = `Duplicate ${pragmaName} item: ${name}`

      // If we find a plugin Lambda, that means the filter let it through because it's required by the plugin, so we must now error
      let foundPlugin = lambdas.find(l => l._plugin && l.name === name)
      if (foundPlugin) err = `Plugin requires conflicting ${pragmaName} item: ${name}, plugin: ${foundPlugin._plugin}, method: set.${pragma}`

      namesErrored.push(name)
      errors.push(err)
    }
    names.push(name)
  })
}

module.exports = {
  regex,
  size,
  unique,
}
