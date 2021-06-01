let is = require('../../../lib/is')

let patterns = {
  looseName: new RegExp(/^[a-z][a-zA-Z0-9-_]+$/),
  strictName: new RegExp(/^[a-z][a-z0-9-]+$/),
}

function regex (value, pattern, pragma, errors) {
  if (!patterns[pattern]) throw ReferenceError(`Invalid validation pattern specified: ${pattern}`)
  if (!patterns[pattern].test(value)) errors.push(`Invalid ${pragma} value: '${value}' must match ${patterns[pattern]}`)
}

function size (value, num, pragma, errors) {
  if (typeof value !== 'string') errors.push(`Invalid ${pragma} value: '${value}' must be a string`)
  if (typeof num !== 'number') throw ReferenceError('Invalid size specified')
  if (value.length > num) errors.push(`Invalid ${pragma} value: '${value}' must less than ${num} characters`)
}

function unique (lambdas, pragma, errors) {
  if (!is.array(lambdas)) throw ReferenceError(`Invalid Lambda array: ${lambdas}`)
  let names = []
  if (lambdas.length) lambdas.forEach(({ name }) => {
    let err = `Duplicate ${pragma}: ${name}`
    if (names.includes(name) && !errors.includes(err)) errors.push(err)
    names.push(name)
  })
}

module.exports = {
  regex,
  size,
  unique,
}
