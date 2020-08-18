let populate = require('./populate-lambda')

module.exports = function configureWebSockets ({ arc, inventory }) {
  if (!arc.ws) return null

  let ws = [ ...arc.ws ]

  // Backfill required routes if not already present
  let defaults = [ 'disconnect', 'default', 'connect' ]
  defaults.forEach(route => {
    let found = arc.ws.find(item => {
      if (item === route) return true
      if (item[route]) return true
    })
    if (!found) ws.unshift(route)
  })

  let websockets = populate.ws(ws, inventory)

  return websockets
}
