let { is, getLambdaDirs } = require('../../../lib')

module.exports = function populateWebSockets (params) {
  let { item, errors, plugin } = params
  if (plugin) {
    let { name, src } = item
    if (name && src) {
      return { ...item, route: name, ...getLambdaDirs(params, { plugin }) }
    }
    errors.push(`Invalid plugin-generated @ws item: name: ${name}, src: ${src}`)
    return
  }
  else if (is.string(item)) {
    let name = item
    let route = name // Same as name, just what AWS calls it
    let dirs = getLambdaDirs(params, { name })
    return { name, route, ...dirs }
  }
  else if (is.object(item)) {
    let name = Object.keys(item)[0]
    let route = name
    let dirs = getLambdaDirs(params, { name, customSrc: item[name].src })
    return { name, route, ...dirs }
  }
  errors.push(`Invalid @ws item: ${item}`)
}
