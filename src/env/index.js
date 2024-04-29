let { mergeEnvVars } = require('../lib')

/**
 * Read env vars out of SSM
 */
module.exports = function env (params, inventory, callback) {
  if (!params.env) {
    return callback()
  }

  let aws
  let name = inventory.app
  let { profile, region } = inventory.aws
  let result = []
  let awsLite = require('@aws-lite/client')
  /* istanbul ignore next */
  awsLite({ profile, region, plugins: [ import('@aws-lite/ssm') ] }).then(_aws => {
    aws = _aws

    // Perform the query
    let params = {
      Path: `/${name}`,
      Recursive: true,
      MaxResults: 10,
      WithDecryption: true,
      paginate: true,
    }
    aws.ssm.GetParametersByPath(params).then(data => {
      // Tidy up the response
      result = result.concat(data.Parameters.map(param => {
        let bits = param.Name.split('/')
        return {
          app: name, // jic
          env: bits[2],
          name: bits[3],
          value: param.Value,
        }
      }))

      let testing = null
      let staging = null
      let production = null
      if (result.length) {
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
        return callback(Error(errors[0]))
      }
      callback()
    }).catch(err => callback(err))
  }).catch(err => callback(err))
}
