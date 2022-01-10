function getExt (runtime) {
  if (runtime.startsWith('node'))   return '.js'
  if (runtime.startsWith('python')) return '.py'
  if (runtime.startsWith('ruby'))   return '.rb'
  if (runtime.startsWith('deno'))   return '.ts'
  return ''
}

module.exports = function getHandler ({ config, src, build, errors }) {
  let { handler, runtime, runtimeConfig } = config
  let parts = handler.split('.')
  if (parts.length !== 2) errors.push(`Invalid handler: ${handler}. Expected {file}.{function}, example: index.handler`)
  let ext = getExt(runtime)
  let file = `${parts[0]}${ext}`
  let handlerFile = `${src}/${file}`
  let handlerMethod = parts[1]
  // Compiled to an interpreted runtime (eg TypeScript)
  if (build && runtimeConfig?.baseRuntime) {
    file = runtimeConfig?.handlerFile ? runtimeConfig.handlerFile : file
    ext = runtimeConfig?.handlerFile ? '' : getExt(runtimeConfig.baseRuntime)
    handlerFile = `${build}/${file}${ext}`
  }
  // Compiled to a binary
  else if (build) {
    file = runtimeConfig?.handlerFile ? runtimeConfig.handlerFile : file
    handlerFile = `${build}/${file}`
  }
  // Interpreted
  else if (runtimeConfig?.handlerFile || runtimeConfig?.handlerMethod) {
    if (runtimeConfig.handlerFile) handlerFile = `${src}/${runtimeConfig.handlerFile}`
    if (runtimeConfig.handlerMethod) handlerMethod = runtimeConfig.handlerMethod
  }
  return { handlerFile, handlerMethod }
}
