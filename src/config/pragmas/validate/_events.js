let { regex, size, unique } = require('./_lib')

/**
 * Validate @events + @queues
 *
 * Where possible, attempts to follow SNS + SQS validation:
 * See: https://docs.aws.amazon.com/sns/latest/dg/sns-message-attributes.html
 * See: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-metadata.html
 */
module.exports = function validateEventsAndQueues (pragma, pragmaName, errors) {
  if (pragma?.length) {
    unique(pragma, pragmaName, errors)

    pragma.forEach(event => {
      let { name } = event
      regex(name, 'veryLooseName', pragmaName, errors)

      // Assume 10 chars are taken up by resource naming in arc/package
      size(name, 1, 246, pragmaName, errors)

      // Starts with a period
      if (name.match(/^\./g)) {
        errors.push(`Invalid ${pragmaName} item (cannot start with a period): ${name}`)
      }

      // Ends with a period
      if (name.match(/\.$/g)) {
        errors.push(`Invalid ${pragmaName} item (cannot end with a period): ${name}`)
      }

      // Contains successive periods, i.e. ..
      if (name.match(/\.\./g)) {
        errors.push(`Invalid ${pragmaName} item (cannot have successive periods): ${name}`)
      }

      // Cannot start with 'AWS' or 'Amazon'
      let n = name.toLowerCase()
      if (n.startsWith('aws') || n.startsWith('amazon')) {
        errors.push(`Invalid ${pragmaName} item (cannot start with 'AWS' or 'Amazon'): ${name}`)
      }
    })
  }
}
