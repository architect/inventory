let { is, getLambdaDirs } = require('../../../lib')

function getQueueBehaviorProps (item, name) {
  let fifo = is.defined(item?.[name]?.fifo) ? item[name].fifo : null
  let batchSize = is.defined(item?.[name]?.batchSize) ? item[name].batchSize : null
  let batchWindow = is.defined(item?.[name]?.batchWindow) ? item[name].batchWindow : null
  return { fifo, batchSize, batchWindow }
}

module.exports = function populateQueues (params) {
  let { type, item, errors, plugin } = params

  if (plugin) {
    let { name, src } = item
    if (name && src) {
      return { ...item, ...getQueueBehaviorProps(item, name), ...getLambdaDirs(params, { plugin }) }
    }
    errors.push(`Invalid plugin-generated @${type} item: name: ${name}, src: ${src}`)
    return
  }
  else if (is.string(item)) {
    let name = item
    let dirs = getLambdaDirs(params, { name })
    return { name, ...getQueueBehaviorProps(item, name), ...dirs }
  }
  else if (is.object(item)) {
    let name = Object.keys(item)[0]
    let dirs = getLambdaDirs(params, { name, customSrc: item[name].src })
    return { name, ...getQueueBehaviorProps(item, name), ...dirs }
  }
  errors.push(`Invalid @${type} item: ${item}`)
}
