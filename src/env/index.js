
/**
 * Read env vars out of SSM
 */
module.exports = function env (params, inventory, callback) {
  if (params.env) {
    // eslint-disable-next-line
    let aws = require('aws-sdk')
    let name = inventory.app
    let { region } = inventory.aws
    let ssm = new aws.SSM({ region })
    let result = []

    function getSomeEnvVars (name, NextToken, callback) {
      // Base query to ssm
      let query = {
        Path: `/${name}`,
        Recursive: true,
        MaxResults: 10,
        WithDecryption: true
      }

      // Check if we're paginating
      if (NextToken) query.NextToken = NextToken

      // Perform the query
      ssm.getParametersByPath(query, function _query (err, data) {
        if (err) callback(err)
        else {
          // Tidy up the response
          result = result.concat(data.Parameters.map(function (param) {
            let bits = param.Name.split('/')
            return {
              app: name, // jic
              env: bits[2],
              name: bits[3],
              value: param.Value,
            }
          }))
          // Check for more data and, if so, recurse
          if (data.NextToken) {
            getSomeEnvVars(name, data.NextToken, callback)
          }
          else callback(null, result)
        }
      })
    }

    getSomeEnvVars(name, false, function done (err, result) {
      if (err) callback(err)
      else {
        let env = null
        if (result.length) {
          let testing = null
          let staging = null
          let production = null
          result.forEach(r => {
            if (r.env === 'testing') testing = Object.assign({}, testing, { [r.name]: r.value })
            if (r.env === 'staging') staging = Object.assign({}, staging, { [r.name]: r.value })
            if (r.env === 'production') production = Object.assign({}, production, { [r.name]: r.value })
          })
          env = { testing, staging, production }
        }
        callback(null, env)
      }
    })
  }
  else callback()
}
