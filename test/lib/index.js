let { homedir } = require('os')
let { is } = require('../../src/lib')

function getHomedir () {
  let _homedir = homedir()
  if (process.platform === 'win32') _homedir = _homedir.replace(/^[A-Z]:\\/, '')
  return _homedir
}

function setterPluginSetup (setter, fns) {
  let methods = is.array(fns) ? fns : [ fns ]
  methods = methods.map(m => {
    m._plugin = 'test'
    m._type = 'plugin'
    return m
  })
  return { _methods: { set: { [setter]: methods } } }
}

module.exports = {
  getHomedir,
  setterPluginSetup,
}
