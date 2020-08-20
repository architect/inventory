module.exports = function getHandler (config, src) {
  let { handler, runtime } = config
  let parts = handler.split('.')
  if (parts.length !== 2) throw Error(`Invalid handler: ${handler}. Expected {file}.{function}, example: index.handler`)
  let ext
  if (runtime.startsWith('nodejs')) ext = 'js'
  if (runtime.startsWith('python')) ext = 'py'
  if (runtime.startsWith('ruby'))   ext = 'rb'
  // TODO add Go, Java, .NET, etc.
  let handlerFile = `${src}/${parts[0]}.${ext}`
  let handlerFunction = parts[1]
  return { handlerFile, handlerFunction }
}
