let patterns = {
  looseName: new RegExp(/^[a-z][a-zA-Z0-9-_]+$/),
  strictName: new RegExp(/^[a-z][a-z0-9-]+$/),
}

function regex (value, pattern, pragma, errors) {
  let matching = typeof pattern === 'string' ? patterns[pattern] : pattern
  if (!matching.test(value)) errors.push(`Invalid ${pragma} value: ${value} must match ${pattern}`)
}

function size (value, num, pragma, errors) {
  if (typeof value !== 'string') errors.push(`Value must be a string: ${value}`)
  if (typeof num !== 'number') errors.push(`validate.size requires a number: ${num}`)
  if (value.length > num) errors.push(`Invalid ${pragma} value: ${value} must less than ${num} characters`)
}

function unique (lambdas, pragma, errors) {
  let names = []
  if (lambdas.length) lambdas.forEach(({ name }) => {
    let err = `Duplicate ${pragma}: ${name}`
    if (names.includes(name) && !errors.includes(err)) errors.push(err)
    names.push(name)
  })
}

module.exports = {
  patterns,
  regex,
  size,
  unique,
}
