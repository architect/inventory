let { validate } =  require('./validate')
let { is } = require('../../lib')

module.exports = function configureApp ({ arc, errors }) {
  if (!is.array(arc.app) ||
      arc.app.length !== 1 ||
      !is.string(arc.app[0])) {
    errors.push('@app name not found or invalid')
    return null
  }

  let appName = arc.app[0]

  // Validation
  validate.regex(appName, 'looseName', '@app', errors)
  validate.size(appName, 1, 100, '@app', errors)

  return appName
}
