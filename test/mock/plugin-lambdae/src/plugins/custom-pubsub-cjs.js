let { join } = require('path')
let name = 'pubsub-cjs'

module.exports = {
  set: {
    customLambdas: function ({ inventory }) {
      let { inv } = inventory
      let { cwd } = inv._project
      return inv._project.arc[name].map((channel) => {
        return {
          name: channel,
          src: join(cwd, 'src', name, channel),
        }
      })
    }
  }
}
