let { join } = require('path')

module.exports = function populateScheduled ({ item, dir }) {
  let rate = null
  let cron = null
  if (Array.isArray(item) && item.length >= 3) {
    let name = item[0]

    // Handle rate + cron
    let sched = item.slice(1).join(' ').split('(')
    let schedType = sched[0]
    let schedValue = sched[1].replace(')', '')
    if (schedType === 'rate') rate = schedValue
    if (schedType === 'cron') cron = schedValue

    let srcDir = join(process.cwd(), dir, name)
    return { name, srcDir, rate, cron }
  }
  else if (typeof item === 'object') {
    let name = Object.keys(item)[0]

    // Handle rate + cron
    if (item[name].rate) rate = item[name].rate.join(' ')
    if (item[name].cron) cron = item[name].cron.join(' ')

    let srcDir = item[name].path
      ? join(process.cwd(), item[name].path)
      : join(process.cwd(), dir, name)
    return { name, srcDir, rate, cron }
  }
  throw Error(`Invalid @scheduled item: ${item}`)
}
