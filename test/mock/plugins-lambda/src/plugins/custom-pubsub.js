let { join } = require('path')

module.exports = {
  pluginFunctions: function (arc, inventory) {
    let cwd = inventory.inv._project.src
    return inventory.inv._project.arc.pubsub.map((channel) => {
      return {
        src: join(cwd, 'src', 'pubsub', channel),
        name: channel,
        body: `exports.handler = async function (event) { console.lo
  g(event) }`
      }
    })
  }
}
