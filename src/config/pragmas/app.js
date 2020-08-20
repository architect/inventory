module.exports = function configureApp ({ arc }) {
  if (!Array.isArray(arc.app) ||
      arc.app.length !== 1 ||
      typeof arc.app[0] !== 'string') {
    throw Error('@app name not found')
  }

  let appName = arc.app[0]

  return appName
}
