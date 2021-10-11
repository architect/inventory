module.exports = function validateAWS (aws, errors) {
  let { apigateway } = aws

  if (apigateway) {
    let valid = [ 'http', 'httpv1', 'httpv2', 'rest' ]
    if (!valid.includes(apigateway)) {
      errors.push(`API type must be 'http[v1|v2]', or 'rest'`)
    }
  }
}
