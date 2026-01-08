let { join } = require('path')
let parse = require('@architect/parser')
let { test } = require('node:test')
let cwd = process.cwd()
let inventoryDefaults = require('../../../../../src/defaults')
let testLib = require('../../../../lib')
let populateScheduled = require('../../../../../src/config/pragmas/scheduled')

let inventory = inventoryDefaults()
let scheduledDir = join(cwd, 'src', 'scheduled')
let str = s => JSON.stringify(s)
let rate = {
  expression: '1 day',
  value: 1,
  interval: 'day',
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
let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'scheduled')

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(populateScheduled, '@scheduled Lambda populator is present')
})

test('No @scheduled returns null', t => {
  t.plan(1)
  t.assert.equal(populateScheduled({ arc: {}, inventory }), null, 'Returned null')
})

test('@scheduled population: simple format', t => {
  t.plan(11)

  let arc = parse(`
@scheduled
${values.join('\n')}
`)
  let scheduled = populateScheduled({ arc, inventory })
  t.assert.equal(scheduled.length, values.length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.assert.ok(scheduled.some(sched => sched.name === name), `Got scheduled event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.assert.equal(sched.src, join(scheduledDir, sched.name), `Scheduled event configured with correct source dir: ${sched.src}`)
    t.assert.ok(sched.handlerFile.startsWith(sched.src), `Handler file is in the correct source dir`)
    if (sched.rate) {
      t.assert.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.assert.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.assert.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.assert.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.assert.fail('Could not find rate or cron expression')
  })
})

test('@scheduled population: simple format (JSON)', t => {
  t.plan(11)

  let arc = parse.json(str({
    'scheduled': {
      [names[0]]: expressions[0],
      [names[1]]: expressions[1],
    },
  }))
  let scheduled = populateScheduled({ arc, inventory })
  t.assert.equal(scheduled.length, values.length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.assert.ok(scheduled.some(sched => sched.name === name), `Got scheduled event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.assert.equal(sched.src, join(scheduledDir, sched.name), `Scheduled event configured with correct source dir: ${sched.src}`)
    t.assert.ok(sched.handlerFile.startsWith(sched.src), `Handler file is in the correct source dir`)
    if (sched.rate) {
      t.assert.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.assert.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.assert.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.assert.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.assert.fail('Could not find rate or cron expression')
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
  src ${names[1]}/path`,
  ]
  let arc = parse(`
@scheduled
${complexValues.join('\n')}
`)
  let scheduled = populateScheduled({ arc, inventory })
  t.assert.equal(scheduled.length, complexValues.length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.assert.ok(scheduled.some(sched => sched.name === name), `Got scheduled event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.assert.equal(sched.src, join(cwd, `${sched.name}/path`), `Scheduled event configured with correct source dir: ${sched.name}/path`)
    t.assert.ok(sched.handlerFile.startsWith(join(cwd, `${sched.name}/path`)), `Handler file is in the correct source dir`)
    if (sched.rate) {
      t.assert.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.assert.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.assert.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.assert.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.assert.fail('Could not find rate or cron expression')
  })
})

test('@scheduled population: complex format with timezone', t => {
  t.plan(13)

  let tz = 'America/New_York'
  let complexValues = [
    `${names[0]}
  rate ${rate.expression}
  src ${names[0]}/path
  timezone ${tz}`,
    `${names[1]}
  cron ${cron.expression}
  src ${names[1]}/path
  timezone ${tz}`,
  ]
  let arc = parse(`
@scheduled
${complexValues.join('\n')}
`)
  let scheduled = populateScheduled({ arc, inventory })
  t.assert.equal(scheduled.length, complexValues.length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.assert.ok(scheduled.some(sched => sched.name === name), `Got scheduled event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.assert.equal(sched.src, join(cwd, `${sched.name}/path`), `Scheduled event configured with correct source dir: ${sched.name}/path`)
    t.assert.ok(sched.handlerFile.startsWith(join(cwd, `${sched.name}/path`)), `Handler file is in the correct source dir`)
    t.assert.equal(sched.timezone, tz, `Got back correct timezone: ${tz}`)
    if (sched.rate) {
      t.assert.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.assert.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.assert.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.assert.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.assert.fail('Could not find rate or cron expression')
  })
})

test('@scheduled population: complex format (JSON)', t => {
  t.plan(11)

  let json = {
    'scheduled': {
      [names[0]]: {
        rate: rate.expression,
        src: `${names[0]}/path`,
      },
      [names[1]]: {
        cron: cron.expression,
        src: `${names[1]}/path`,
      },
    },
  }
  let arc = parse.json(str(json))
  let scheduled = populateScheduled({ arc, inventory })
  t.assert.equal(scheduled.length, Object.keys(json.scheduled).length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.assert.ok(scheduled.some(sched => sched.name === name), `Got scheduled event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.assert.equal(sched.src, join(cwd, `${sched.name}/path`), `Scheduled event configured with correct source dir: ${sched.name}/path`)
    t.assert.ok(sched.handlerFile.startsWith(join(cwd, `${sched.name}/path`)), `Handler file is in the correct source dir`)
    if (sched.rate) {
      t.assert.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.assert.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.assert.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.assert.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.assert.fail('Could not find rate or cron expression')
  })
})

test('@scheduled population: complex format with timezone (JSON)', t => {
  t.plan(13)

  let tz = 'America/New_York'
  let json = {
    'scheduled': {
      [names[0]]: {
        rate: rate.expression,
        src: `${names[0]}/path`,
        timezone: tz,
      },
      [names[1]]: {
        cron: cron.expression,
        src: `${names[1]}/path`,
        timezone: tz,
      },
    },
  }
  let arc = parse.json(str(json))
  let scheduled = populateScheduled({ arc, inventory })
  t.assert.equal(scheduled.length, Object.keys(json.scheduled).length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.assert.ok(scheduled.some(sched => sched.name === name), `Got scheduled event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.assert.equal(sched.src, join(cwd, `${sched.name}/path`), `Scheduled event configured with correct source dir: ${sched.name}/path`)
    t.assert.ok(sched.handlerFile.startsWith(join(cwd, `${sched.name}/path`)), `Handler file is in the correct source dir`)
    t.assert.equal(sched.timezone, tz, `Got back correct timezone: ${tz}`)
    if (sched.rate) {
      t.assert.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.assert.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.assert.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.assert.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.assert.fail('Could not find rate or cron expression')
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
  whatever thingo`,
  ]
  let arc = parse(`
@scheduled
${complexValues.join('\n')}
`)
  let scheduled = populateScheduled({ arc, inventory })
  t.assert.equal(scheduled.length, complexValues.length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.assert.ok(scheduled.some(sched => sched.name === name), `Got scheduled event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.assert.equal(sched.src, join(scheduledDir, sched.name), `Complex scheduled event entry fell back to correct default source dir: ${sched.src}`)
    t.assert.ok(sched.handlerFile.startsWith(sched.src), `Handler file is in the correct source dir`)
    if (sched.rate) {
      t.assert.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.assert.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.assert.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.assert.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.assert.fail('Could not find rate or cron expression')
  })
})

test('@scheduled population: plugin setter', t => {
  t.plan(11)

  let inventory = inventoryDefaults()
  let setter = () => [
    { name: names[0], rate: rate.expression, src: join(scheduledDir, names[0]) },
    { name: names[1], cron: cron.expression, src: join(scheduledDir, names[1]) },
  ]
  inventory.plugins = setterPluginSetup(setter)

  let scheduled = populateScheduled({ arc: {}, inventory })
  t.assert.equal(scheduled.length, values.length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.assert.ok(scheduled.some(sched => sched.name === name), `Got scheduled event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.assert.equal(sched.src, join(scheduledDir, sched.name), `Scheduled event configured with correct source dir: ${sched.src}`)
    t.assert.ok(sched.handlerFile.startsWith(sched.src), `Handler file is in the correct source dir`)
    if (sched.rate) {
      t.assert.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.assert.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.assert.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.assert.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.assert.fail('Could not find rate or cron expression')
  })
})

test('@scheduled population: plugin setter with timezone', t => {
  t.plan(13)

  let tz = 'America/New_York'
  let inventory = inventoryDefaults()
  let setter = () => [
    { name: names[0], rate: rate.expression, src: join(scheduledDir, names[0]), timezone: tz },
    { name: names[1], cron: cron.expression, src: join(scheduledDir, names[1]), timezone: tz },
  ]
  inventory.plugins = setterPluginSetup(setter)

  let scheduled = populateScheduled({ arc: {}, inventory })
  t.assert.equal(scheduled.length, values.length, 'Got correct number of scheduled events back')
  names.forEach(name => {
    t.assert.ok(scheduled.some(sched => sched.name === name), `Got scheduled event: ${name}`)
  })
  scheduled.forEach(sched => {
    t.assert.equal(sched.src, join(scheduledDir, sched.name), `Scheduled event configured with correct source dir: ${sched.src}`)
    t.assert.ok(sched.handlerFile.startsWith(sched.src), `Handler file is in the correct source dir`)
    t.assert.equal(sched.timezone, tz, `Got back correct timezone: ${tz}`)
    if (sched.rate) {
      t.assert.equal(str(rate), str(sched.rate), `Got back correct rate object: ${str(rate)}`)
      t.assert.equal(sched.cron, null, `Got back null cron param`)
    }
    else if (sched.cron) {
      t.assert.equal(str(cron), str(sched.cron), `Got back correct cron object: ${str(cron)}`)
      t.assert.equal(sched.rate, null, `Got back null rate param`)
    }
    else t.assert.fail('Could not find rate or cron expression')
  })
})

test('@scheduled population: validation errors', t => {
  t.plan(30)
  let errors = []
  function run (str) {
    let arc = parse(`@scheduled\n${str}`)
    populateScheduled({ arc, inventory, errors })
  }
  function check (str = 'Invalid schedule errored', qty = 1) {
    t.assert.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Controls
  let rate = `rate(1 day)`
  run(`hello ${rate}`)
  run(`hello-there ${rate}`)
  run(`hello.there ${rate}`)
  run(`helloThere ${rate}`)
  run(`h3llo_there ${rate}`)
  run(`hello
  rate 1 day`)
  run(`hello rate(2 days)`)
  run(`hello rate(2 DAYS)`)
  run(`hi cron(* * * * * *)`)
  run(`hi cron(1 2 3 4 5 6)`)
  run(`hi
  cron * * * * * *`)
  // These aren't actually valid AWS expressions!
  // Just check regex patterns until the validator improves...
  run(`hi cron(1 2 3 a b 4)`)
  run(`hi cron(, , , , , ,)`)
  run(`hi cron(- - - - - -)`)
  run(`hi cron(/ / / / * /)`)
  run(`hi cron(* * L * L *)`)
  run(`hi cron(* * W * "#" *)`)
  // Valid timezone
  run(`hi
  rate 1 day
  timezone America/New_York`)
  run(`hi
  rate 1 day
  timezone Europe/London`)
  run(`hi
  rate 1 day
  timezone UTC`)
  t.assert.equal(errors.length, 0, `Valid scheduled did not error`)

  // Errors
  run(`hello ${rate}\nhello ${rate}`)
  check(`Duplicate scheduled errored`)

  run(`hello rate(1 day)\nhello rate(2 days)`)
  check(`Similarly duplicate scheduled errored`)

  run(`hi there`)
  check()

  run(`hi rate(1 1)`)
  check()

  run(`hi there rate(1 day)`)
  check()

  run(`hi-there! rate(1 day)`)
  check()

  let name = Array.from(Array(130), () => 'hi').join('')
  run(`${name} rate(1 day)`)
  check()

  run(`hi rate(1 day) cron(* * * * * *)`)
  check()

  run(`hi cron(* * * * * *) rate(1 day)`)
  check()

  run(`hi
  rate 1 day
  cron * * * * * *`)
  check()

  run(`hi cron(1 day)`)
  check()

  run(`hi cron(* * * * *)`)
  check()

  run(`hi cron(* * * * * * *)`)
  check()

  run(`hi cron(. . . . . .)`)
  check(undefined, 6)

  run(`hi rate(* * * * *)`)
  check()

  run(`hi rate(0 1 day)`)
  check()

  run(`hi rate(-1 days)`)
  check()

  run(`hi rate(0 days)`)
  check()

  run(`hi rate(1.2 days)`)
  check()

  run(`hi rate('1' day)`)
  check()

  run(`hi rate(a day)`)
  check()

  run(`hi rate(1 days)`)
  check()

  run(`hi rate(2 day)`)
  check()

  run(`hi rate(1,000 days)`)
  check()

  run(`hi rate(1 fortnight)`)
  check()

  run(`hi`)
  check()

  // Invalid timezone errors
  run(`hi
  rate 1 day
  timezone Gallifrey/Capitol`)
  check('Invalid timezone errored')

  run(`hi
  rate 1 day
  timezone NotATimezone`)
  check('Invalid timezone errored')

  run(`hi
  rate 1 day
  timezone 123`)
  check('Invalid timezone errored')
})

test('@scheduled population: plugin errors', t => {
  t.plan(6)
  let errors = []
  function run (returning) {
    let inventory = inventoryDefaults()
    inventory.plugins = setterPluginSetup(() => returning)
    populateScheduled({ arc: {}, inventory, errors })
  }
  function check (str = 'Invalid setter return', qty = 1) {
    t.assert.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Control
  run({ name: 'hi', rate: '1 day', src: 'hi' })
  t.assert.equal(errors.length, 0, `Valid routes did not error`)

  // Errors
  run()
  check()

  run({})
  check()

  run({ name: 'hi' })
  check()

  run({ src: 'hi' })
  check()

  run({ name: 'hi', src: 'hi' })
  check()
})
