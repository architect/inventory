let patterns = {
  looseName: new RegExp(/^[a-z][a-zA-Z0-9-_]+$/),
  strictName: new RegExp(/^[a-z][a-z0-9-]+$/),
}

function regex (value, pattern, pragma) {
  let matching = typeof pattern === 'string' ? patterns[pattern] : pattern
  if (!matching.test(value)) {
    throw Error(`Invalid ${pragma} value: ${value} must match ${pattern}`)
  }
}

function size (value, num, pragma) {
  if (typeof value !== 'string') throw Error(`Value must be a string: ${value}`)
  if (typeof num !== 'number') throw Error(`validate.size requires a number: ${num}`)
  if (value.length > num) throw Error(`Invalid ${pragma} value: ${value} must less than ${num} characters`)
}

module.exports = {
  patterns,
  regex,
  size,
}
