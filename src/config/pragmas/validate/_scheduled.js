let { is } = require('../../../lib')
let { regex, size, unique } = require('./_lib')

/**
 * Validate @scheduled
 *
 * Where possible, attempts to follow EventBridge validation:
 * See: https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_Rule.html
 * See: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html
 * See: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html
 */
module.exports = function validateScheduled (scheduled, errors) {
  if (scheduled?.length) {
    unique(scheduled, '@scheduled', errors)

    scheduled.forEach(schedule => {
      let { name, rate, cron } = schedule
      regex(name, 'veryLooseName', '@scheduled', errors)

      // Assume 14 chars are taken up by resource naming in arc/package
      size(name, 1, 242, '@scheduled', errors)

      if (cron) validateCron(schedule, errors)
      if (rate) validateRate(schedule, errors)

      if (!cron && !rate) errors.push(`Invalid @scheduled item (no cron or rate expression found): ${name}`)
      if (cron && rate) errors.push(`Invalid @scheduled item (use either cron or rate, not both): ${name}`)
    })
  }
}

function validateCron (schedule, errors) {
  let { name, cron } = schedule
  let { expression, minutes, hours, dayOfMonth, month, dayOfWeek, year } = cron

  if (expression.split(' ').length !== 6) {
    return errors.push(`Invalid @scheduled item (cron expressions have six fields): ${name} cron(${expression})`)
  }
  function expErr (description, value) {
    errors.push(`Invalid @scheduled item (${description} value: ${value}): ${name} cron(${expression})`)
  }

  // TODO This validation is not great, but it accomplishes more than the aws-cron-parser module; please improve!
  let minHrYr = /^[\d,\-\*\/]+$/
  let dom =     /^[\d,\-\*\/\?LW]+$/
  let mon =     /^[\da-zA-Z,\-\*\/\?LW]+$/
  let dow =     /^[\da-zA-Z,\-\*\?L#]+$/
  if (!minutes.toString().match(minHrYr)) expErr('minutes', minutes)
  if (!hours.toString().match(minHrYr))   expErr('hours', hours)
  if (!dayOfMonth.toString().match(dom))  expErr('day-of-month', dayOfMonth)
  if (!month.toString().match(mon))       expErr('month', month)
  if (!dayOfWeek.toString().match(dow))   expErr('day-of-week', dayOfWeek)
  if (!year.toString().match(minHrYr))    expErr('year', year)
}

let singular = [ 'minute', 'hour', 'day' ]
let plural = [ 'minutes', 'hours', 'days' ]
function validateRate (schedule, errors) {
  let { name, rate } = schedule
  let { expression, value, interval } = rate

  if (expression.split(' ').length !== 2) {
    return errors.push(`Invalid @scheduled item (rate expressions have two fields): ${name} rate(${expression})`)
  }
  function expErr (description, value) {
    errors.push(`Invalid @scheduled item (${description}, value: ${value}): ${name} rate(${expression})`)
  }

  // Value must be a >0 number
  if (!is.number(value) || !(value > 0)) {
    expErr('rate value must be a whole number greater than 0', value)
  }
  // Interval must be a string
  if (!is.string(interval)) {
    return expErr(`rate interval must be 'minute', 'minutes', 'hour', 'hours', 'day', or 'days'`, interval)
  }
  // Interval must be use the singular/plural values above
  if (!singular.concat(plural).includes(interval)) {
    expErr(`rate interval must be 'minute', 'minutes', 'hour', 'hours', 'day', or 'days'`, interval)
  }
  // Value of 1 must use singular interval
  if (value === 1 && plural.includes(interval)) {
    expErr(`rate value of 1 must use a singular interval, e.g. 'minute', 'hour', 'day'`, interval)
  }
  // Value >1 must use plural interval
  if (value > 1 && singular.includes(interval)) {
    expErr(`rate values greater than 1 must use plural intervals, e.g. 'minutes', 'hours', 'days'`, interval)
  }
}
