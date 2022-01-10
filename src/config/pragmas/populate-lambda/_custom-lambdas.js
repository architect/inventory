let { getLambdaDirs } = require('../../../lib')

module.exports = function populateCustomLambdas (params) {
  let { item, errors } = params
  let { name, src } = item
  if (name && src) {
    return { ...item, ...getLambdaDirs(params, { plugin: true }) }
  }
  errors.push(`Invalid plugin-generated custom Lambda: name: ${name}, src: ${src}`)
}
