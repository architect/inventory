let { normalizeSrc } = require('../../../lib')

module.exports = function populateCustomLambdas ({ cwd, item, errors }) {
  let { name, src } = item
  if (name && src) {
    item.src = normalizeSrc(cwd, src)
    return item
  }
  errors.push(`Invalid plugin-generated custom Lambda: name: ${name}, src: ${src}`)
}
