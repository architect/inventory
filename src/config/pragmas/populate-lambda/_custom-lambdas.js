module.exports = function populateCustomLambdas ({ item, errors, plugin }) {
  if (plugin) {
    let { name, src } = item
    if (name && src) return item
    errors.push(`Invalid plugin-generated custom Lambda: name: ${name}, src: ${src}`)
    return
  }
  else return
}
