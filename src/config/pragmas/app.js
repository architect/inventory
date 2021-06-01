let { validate } =  require('./validate')

module.exports = function configureApp ({ arc, errors }) {
  if (!Array.isArray(arc.app) ||
      arc.app.length !== 1 ||
      typeof arc.app[0] !== 'string') {
    errors.push('@app name not found or invalid')
    return null
  }

  let appName = arc.app[0]

  // Validation
  validate.regex(appName, 'looseName', '@app', errors)
  validate.size(appName, 100, '@app', errors)

  return appName
}
