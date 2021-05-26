let { join } = require('path')

let coerceNumbers = str => !isNaN(Number(str)) ? Number(str) : str

function getRate (expression) {
  // TODO validation
  let bits = expression.split(' ')
  bits = bits.map(coerceNumbers)
  return {
    expression,
    value: bits[0],
    interval: bits[1]
  }
}

function getCron (expression) {
  // TODO validation
  let bits = expression.split(' ')
  bits = bits.map(coerceNumbers)
  return {
    expression,
    minutes: bits[0],
    hours: bits[1],
    dayOfMonth: bits[2],
    month: bits[3],
    dayOfWeek: bits[4],
    year: bits[5],
  }
}

module.exports = function populateScheduled ({ item, dir, cwd, errors }) {
  let rate = null
  let cron = null
  if (Array.isArray(item) && item.length >= 3) {
    let name = item[0]

    // Handle rate + cron
    let sched = item.slice(1).join(' ').split('(')
    let schedType = sched[0]
    let schedValue = sched[1].replace(')', '')
    if (schedType === 'rate') rate = getRate(schedValue)
    if (schedType === 'cron') cron = getCron(schedValue)

    let src = join(cwd, dir, name)
    return { name, src, rate, cron }
  }
  else if (typeof item === 'object' && !Array.isArray(item)) {
    let name = Object.keys(item)[0]

    // Handle rate + cron
    if (item[name].rate) rate = getRate(item[name].rate.join(' '))
    if (item[name].cron) cron = getCron(item[name].cron.join(' '))

    let src = item[name].src
      ? join(cwd, item[name].src)
      : join(cwd, dir, name)
    return { name, src, rate, cron }
  }
  errors.push(`Invalid @scheduled item: ${item}`)
}
