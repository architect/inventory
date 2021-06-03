let { regex, size, unique } = require('./_lib')

/**
 * Validate @ws (WebSockets)
 *
 * AWS hasn't (yet) published validation on WebSocket route names, so this is based entirely on observed behavior
 */
module.exports = function validateWS (websockets, errors) {
  // No need to check pragma length as WS always has 3 defaults
  unique(websockets, '@ws', errors)

  websockets.forEach(ws => {
    let { name } = ws

    // No observed char length limits but let's be reasonable
    size(name, 1, 255, '@ws', errors)
    regex(name, 'veryLooseName', '@ws', errors)
  })
}
