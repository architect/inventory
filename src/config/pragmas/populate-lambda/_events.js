let { is, getLambdaDirs } = require('../../../lib')

module.exports = function populateEvents (params) {
  let { type, item, errors, plugin } = params
  if (plugin) {
    let { name, src } = item
    if (name && src) {
      return { ...item, ...getLambdaDirs(params, { plugin }) }
    }
    errors.push(`Invalid plugin-generated @${type} item: name: ${name}, src: ${src}`)
    return
  }
  else if (is.string(item)) {
    let name = item
    let dirs = getLambdaDirs(params, { name })
    return { name, ...dirs }
  }
  else if (is.object(item)) {
    let name = Object.keys(item)[0]
    let dirs = getLambdaDirs(params, { name, customSrc: item[name].src })
    return { name, ...dirs }
  }
  errors.push(`Invalid @${type} item: ${item}`)
}
