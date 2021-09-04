let { join } = require('path')
let is = require('../../../lib/is')

let coerceNumbers = str => !isNaN(Number(str)) ? Number(str) : str

// Expression validation happens in the validate step, just best-effort assemble here
let get = {
  rate (expression) {
    let bits = expression.split(' ')
    bits = bits.map(coerceNumbers)
    let interval = is.string(bits[1]) ? bits[1].toLowerCase() : bits[1]
    return {
      expression,
      value: bits[0],
      interval,
    }
  },
  cron (expression) {
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
}

module.exports = function populateScheduled ({ item, dir, cwd, errors }) {
  let rate = null
  let cron = null
  if (is.array(item) && item.length >= 3) {
    let name = item[0]

    // Hacky but it works
    let clean = item => item[0].replace('(', '').replace(')', '').substr(4)

    // Handle rate + cron
    let sched = item.slice(1).join(' ')
    let isCron = sched.match(/^cron\([^\)]*\)$/)
    let isRate = sched.match(/^rate\([^\)]*\)$/)
    if (isRate) rate = get.rate(clean(isRate))
    if (isCron) cron = get.cron(clean(isCron))

    let src = join(cwd, dir, name)
    return { name, src, rate, cron }
  }
  else if (is.object(item)) {
    let name = Object.keys(item)[0]

    // Handle rate + cron
    if (item[name].rate) rate = get.rate(item[name].rate.join(' '))
    if (item[name].cron) cron = get.cron(item[name].cron.join(' '))

    let src = item[name].src
      ? join(cwd, item[name].src)
      : join(cwd, dir, name)
    return { name, src, rate, cron }
  }
  errors.push(`Invalid @scheduled item: ${item}`)
}
