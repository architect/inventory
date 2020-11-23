module.exports = function validateAWS (aws) {
  let { apigateway } = aws

  if (apigateway) {
    let valid = [ 'http', 'httpv1', 'httpv2', 'rest' ]
    if (!valid.some(v => v === apigateway)) {
      throw ReferenceError(`API type must be 'http[v1|v2]', or 'rest'`)
    }
  }
}
