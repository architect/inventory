let populate = require('./populate-lambda')
let validate = require('./validate')

module.exports = function configureWS ({ arc, inventory, errors }) {
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

  let websockets = populate.ws(ws, inventory, errors)

  // Forgive and normalize userland use of '$default', '$connect', '$disconnect'
  websockets.forEach(({ name }, i) => {
    let trunc = name.substr(1)
    if (name.startsWith('$') && defaults.includes(trunc)) websockets[i].name = trunc
  })

  validate.websockets(websockets, errors)

  return websockets
}
