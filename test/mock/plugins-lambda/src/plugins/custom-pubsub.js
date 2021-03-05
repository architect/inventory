let { join } = require('path')

module.exports = {
  pluginFunctions: function ({ inventory }) {
    let cwd = inventory.inv._project.src
    return inventory.inv._project.arc.pubsub.map((channel) => {
      return {
        src: join(cwd, 'src', 'pubsub', channel),
        name: channel
      }
    })
  }
}
