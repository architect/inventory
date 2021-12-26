let { join } = require('path')

module.exports = {
  set: {
    customLambdas: function ({ inventory }) {
      let cwd = inventory._project.src
      return inventory._project.arc.pubsub.map((channel) => {
        return {
          name: channel,
          src: join(cwd, 'src', 'pubsub', channel),
        }
      })
    }
  }
}
