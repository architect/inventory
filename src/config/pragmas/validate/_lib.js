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
  let names = []
  if (lambdas.length) lambdas.forEach(({ name }) => {
    let err = `Duplicate ${pragmaName} item: ${name}`
    if (names.includes(name) && !errors.includes(err)) errors.push(err)
    names.push(name)
  })
}

module.exports = {
  regex,
  size,
  unique,
}
