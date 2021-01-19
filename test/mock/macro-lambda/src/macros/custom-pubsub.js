let { join } = require('path')

module.exports = () => {}

module.exports.create = function (inventory) {
  let cwd = inventory.inv._project.src
  return inventory.inv._project.arc.pubsub.map((channel) => {
    return {
      src: join(cwd, 'src', 'pubsub', channel),
      name: channel,
      body: `exports.handler = async function (event) { console.log(event) }`
    }
  })
}
