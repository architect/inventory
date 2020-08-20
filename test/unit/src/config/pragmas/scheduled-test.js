let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'scheduled')
let populateScheduled = require(sut)

let cwd = process.cwd()
let inventory = inventoryDefaults()
inventory.project.src = cwd
let scheduledDir = join(cwd, 'src', 'scheduled')
let str = s => JSON.stringify(s)
let rate = {
  expression: '1 day',
  value: 1,
  interval: 'day'
}
let cron = {
  expression: '1 2 3 4 5 6',
  minutes: 1,
  hours: 2,
  dayOfMonth: 3,
  month: 4,
  dayOfWeek: 5,
  year: 6,
}
let names = [ 'foo', 'bar' ]
let expressions = [ `rate(${rate.expression})`, `cron(${cron.expression})` ]
let values = [ `${names[0]} ${expressions[0]}`, `${names[1]} ${expressions[1]}` ]

test('Set up env', t => {
  t.plan(1)
  t.ok(populateScheduled, '@scheduled Lambda populator is present')
})

test('No @scheduled returns null', t => {
  t.plan(1)
  t.equal(populateScheduled({ arc: {}, inventory }), null, 'Returned null')
})

test('@scheduled population: simple format', t => {
  t.plan(11)

  let arc = parse(`
@scheduled
${values.join('\n')}
`)
  let scheduled = populateScheduled({ arc, inventory })
  t.equal(scheduled.length, values.length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.ok(scheduled.some(sched => sched.name === name), `Got scheduled event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.equal(sched.src, join(scheduledDir, sched.name), `Scheduled event configured with correct source dir: ${sched.src}`)
    t.ok(sched.handlerFile.startsWith(sched.src), `Handler file is in the correct source dir`)
    if (sched.rate) {
      t.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.fail('Could not find rate or cron expression')
  })
})

test('@scheduled population: complex format', t => {
  t.plan(11)

  let complexValues = [
    `${names[0]}
  rate ${rate.expression}
  src ${names[0]}/path`,
    `${names[1]}
  cron ${cron.expression}
  src ${names[1]}/path`
  ]
  let arc = parse(`
@scheduled
${complexValues.join('\n')}
`)
  let scheduled = populateScheduled({ arc, inventory })
  t.equal(scheduled.length, complexValues.length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.ok(scheduled.some(event => event.name === name), `Got event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.equal(sched.src, join(cwd, `${sched.name}/path`), `Scheduled event configured with correct source dir: ${sched.name}/path`)
    t.ok(sched.handlerFile.startsWith(join(cwd, `${sched.name}/path`)), `Handler file is in the correct source dir`)
    if (sched.rate) {
      t.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.fail('Could not find rate or cron expression')
  })
})

test('@scheduled population: complex format + fallback to default paths', t => {
  t.plan(11)

  let complexValues = [
    `${names[0]}
  rate ${rate.expression}
  whatever thingo`,
    `${names[1]}
  cron ${cron.expression}
  whatever thingo`
  ]
  let arc = parse(`
@scheduled
${complexValues.join('\n')}
`)
  let scheduled = populateScheduled({ arc, inventory })
  t.equal(scheduled.length, complexValues.length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.ok(scheduled.some(event => event.name === name), `Got event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.equal(sched.src, join(scheduledDir, sched.name), `Complex event entry fell back to correct default source dir: ${sched.src}`)
    t.ok(sched.handlerFile.startsWith(sched.src), `Handler file is in the correct source dir`)
    if (sched.rate) {
      t.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.fail('Could not find rate or cron expression')
  })
})

test('@scheduled population: invalid events throw', t => {
  t.plan(1)
  let arc = parse(`
@scheduled
hi there
`)
  t.throws(() => {
    populateScheduled({ arc, inventory })
  }, 'Invalid event threw')
})
