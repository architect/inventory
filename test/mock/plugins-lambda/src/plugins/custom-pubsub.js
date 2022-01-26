let { join } = require('path')

module.exports = {
  set: {
    customLambdas: function ({ inventory }) {
      let { inv } = inventory
      let { cwd } = inv._project
      return inv._project.arc.pubsub.map((channel) => {
        return {
          name: channel,
          src: join(cwd, 'src', 'pubsub', channel),
        }
      })
    }
  }
}
