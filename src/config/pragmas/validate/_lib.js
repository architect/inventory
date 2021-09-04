let is = require('../../../lib/is')

let patterns = {
  looseName: new RegExp(/^[a-z][a-zA-Z0-9-_]+$/),
  strictName: new RegExp(/^[a-z][a-z0-9-]+$/),
  // DynamoDB, SNS, SQS
  veryLooseName: new RegExp(/^[a-zA-Z0-9/\-._]*$/),
}

function regex (value, pattern, pragmaName, errors) {
  if (!patterns[pattern]) throw ReferenceError(`Invalid validation pattern specified: ${pattern}`)
  if (!patterns[pattern].test(value)) errors.push(`Invalid ${pragmaName} item: '${value}' must match ${patterns[pattern]}`)
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
