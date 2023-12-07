let os = require('os')
let { is } = require('../../src/lib')

let homedirBak
let tmpHomedir
function overrideHomedir (tmp) {
  if (tmp) tmpHomedir = tmp
  if (!homedirBak) homedirBak = os.homedir
  os.homedir = () => tmpHomedir
}
overrideHomedir.reset = () => {
  if (homedirBak) {
    os.homedir = homedirBak
    homedirBak = undefined
  }
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
  overrideHomedir,
  setterPluginSetup,
}
