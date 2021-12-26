let { is } = require('../../src/lib')

function setterPluginSetup (setter, fns) {
  let methods = is.array(fns) ? fns : [ fns ]
  methods = methods.map(m => {
    m.plugin = 'test'
    m.type = 'plugin'
    return m
  })
  return { _methods: { set: { [setter]: methods } } }
}

module.exports = {
  setterPluginSetup
}
