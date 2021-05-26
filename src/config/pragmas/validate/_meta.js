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

module.exports = {
  patterns,
  regex,
  size,
}
