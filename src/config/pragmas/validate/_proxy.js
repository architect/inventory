module.exports = function validateProxy (proxy, errors) {
  Object.values(proxy).forEach(url => {
    try {
      let isHttp = /^https?:$/
      let { protocol } = new URL(url)
      if (!isHttp.test(protocol)) {
        errors.push(`Invalid @proxy protocol: ${url}`)
      }
    }
    catch {
      errors.push(`Invalid @proxy URL: ${url}`)
    }
  })
}
