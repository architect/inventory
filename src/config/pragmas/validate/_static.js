let { is } = require('../../../lib')

module.exports = function validateStatic (_static, errors) {
  // `folder` validation happens elsewhere
  let {
    compression,
    fingerprint,
    ignore,
    prefix,
    prune,
    spa,
    staging,
    production,
  } = _static

  if (compression && ![ true, 'br', 'gzip' ].includes(compression)) {
    errors.push(`Compression must be 'br' or 'gzip'`)
  }
  if (fingerprint && ![ true, 'external' ].includes(fingerprint)) {
    errors.push(`Fingerprint must be true or 'external'`)
  }
  if (ignore && (!is.array(ignore) || !ignore.every(i => is.string(i)))) {
    errors.push(`Ignore must be a list of one or more strings`)
  }
  if (prefix && !is.string(prefix)) {
    errors.push(`Prefix must be a string`)
  }
  if (!is.nullish(prune) && !is.bool(prune)) {
    errors.push(`Prune must be a boolean`)
  }
  if (!is.nullish(spa) && !is.bool(spa)) {
    errors.push(`spa must be a string`)
  }
  if (!is.nullish(staging) && !is.string(staging)) {
    errors.push(`Staging must be a string`)
  }
  if (!is.nullish(production) && !is.string(production)) {
    errors.push(`Production must be a string`)
  }
}
