let { mergeEnvVars } = require('../lib')

/**
 * Read env vars out of SSM
 */
module.exports = function env (params, inventory, callback) {
  if (!params.env) {
    return callback()
  }

  /* istanbul ignore next */
  try {
    // eslint-disable-next-line
    try { require('aws-sdk/lib/maintenance_mode_message').suppress = true }
    catch { /* Noop */ }
    // eslint-disable-next-line
    var aws = require('aws-sdk')
  }
  catch (err) {
    let msg = `'aws-sdk' not found, please install locally or globally (see also readme#aws-sdk-caveat)`
    return callback(Error(msg))
  }
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
    /* istanbul ignore if */
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
        /* istanbul ignore if: Sadly no way to easily mock this for testing */
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
      let testing = null
      let staging = null
      let production = null
      if (result.length) {
        // TODO refactor into a reducer?
        result.forEach(({ env, name: k, value: v }) => {
          if (env === 'testing') testing = Object.assign({}, testing, { [k]: v })
          if (env === 'staging') staging = Object.assign({}, staging, { [k]: v })
          if (env === 'production') production = Object.assign({}, production, { [k]: v })
        })
      }

      let errors = []
      inventory._project.env.aws = mergeEnvVars({
        env: 'Application',
        source: inventory._project.env.plugins,
        target: { testing, staging, production },
        errors,
      })
      if (errors.length) {
        callback(Error(errors[0]))
        return
      }
      callback()
    }
  })
}
