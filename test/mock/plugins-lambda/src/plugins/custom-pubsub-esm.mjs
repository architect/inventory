import { join } from 'path'
let name = 'pubsub-esm'

let plugin = {
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

export default plugin
