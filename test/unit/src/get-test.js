let { join } = require('path')
let test = require('tape')
let inventoryPath = join(process.cwd(), 'src')
let inventory = require(inventoryPath)
let sut = join(process.cwd(), 'src', 'get')
let getter = require(sut)

let mock = join(process.cwd(), 'test', 'mock')

test('Set up env', t => {
  t.plan(1)
  t.ok(getter, 'Getter is present')
})

// This test assumes that the bits of inventory running here remain sync
// Should anything go async, this test may exhibit wonky behavior!
let get

/**
 * Max mode
 */
test('Set up max inventory', t => {
  t.plan(1)
  inventory({ cwd: join(mock, 'max') }, (err, result) => {
    if (err) t.fail(err)
    else {
      get = getter(result.inv)
      t.ok(get, 'Got getter')
    }
  })
})

test('Get @app', t => {
  t.plan(2)
  t.ok(get.app, 'Got @app getter')
  t.equal(get.app(), 'maxed-out', 'Got back correct value: maxed-out')
})

test('Get @aws', t => {
  t.plan(4)
  t.ok(get.aws, 'Got @aws getter')
  t.equal(get.aws('region'), 'us-west-1', 'Got back correct value: us-west-1')
  t.equal(get.aws('profile'), null, 'Got back correct value: null')
  t.notOk(get.aws('idk'), 'Did not get back nonexistent setting')
})

test('Get @cdn', t => {
  t.plan(2)
  t.ok(get.cdn, 'Got @cdn getter')
  t.ok(get.cdn(), 'Got back CDN setting')
})

test('Get @events', t => {
  t.plan(4)
  t.ok(get.events, 'Got @events getter')
  t.ok(get.events('an-event'), 'Got back correct value: an-event')
  t.ok(get.events('another-event'), 'Got back correct value: another-event')
  t.notOk(get.events('some-event'), 'Did not get back nonexistent event')
})

test('Get @http', t => {
  t.plan(4)
  t.ok(get.http, 'Got @http getter')
  t.ok(get.http('get /'), 'Got back correct value: get /')
  t.ok(get.http('put /some-put'), 'Got back correct value: put /some-put')
  t.notOk(get.http('get /nope'), 'Did not get back nonexistent route')
})

/* test('Get @macros', t => {
  t.plan(3)
  t.ok(get.macros, 'Got @macros getter')
  t.ok(get.macros('prune'), 'Got back correct value: prune')
  t.notOk(get.macros('idk'), 'Did not get back nonexistent macro')
}) */

// TODO add @plugins

test('Get @proxy', t => {
  t.plan(4)
  t.ok(get.proxy, 'Got @proxy getter')
  t.ok(get.proxy('testing'), 'Got back correct value: testing')
  t.ok(get.proxy('staging'), 'Got back correct value: staging')
  t.notOk(get.proxy('idk'), 'Did not get back nonexistent setting')
})

test('Get @queues', t => {
  t.plan(4)
  t.ok(get.queues, 'Got @queues getter')
  t.ok(get.queues('a-queue'), 'Got back correct value: a-queue')
  t.ok(get.queues('another-queue'), 'Got back correct value: another-queue')
  t.notOk(get.queues('idk'), 'Did not get back nonexistent queue')
})

test('Get @scheduled', t => {
  t.plan(6)
  t.ok(get.scheduled, 'Got @scheduled getter')
  t.ok(get.scheduled('rate-scheduled-simple'), 'Got back correct value: rate-scheduled-simple')
  t.ok(get.scheduled('cron-scheduled-simple'), 'Got back correct value: cron-scheduled-simple')
  t.ok(get.scheduled('rate-scheduled-complex'), 'Got back correct value: rate-scheduled-complex')
  t.ok(get.scheduled('rate-scheduled-complex'), 'Got back correct value: rate-scheduled-complex')
  t.notOk(get.scheduled('idk'), 'Did not get back nonexistent scheduled event')
})

test('Get @shared', t => {
  t.plan(4)
  t.ok(get.shared, 'Got @shared getter')
  t.ok(get.shared('src'), 'Got back correct value: src')
  t.ok(get.shared('shared'), 'Got back correct value: shared')
  t.notOk(get.shared('idk'), 'Did not get back nonexistent setting')
})

test('Get @static', t => {
  t.plan(4)
  t.ok(get.static, 'Got @static getter')
  t.equal(get.static('folder'), 'some-folder', 'Got back correct value: some-folder')
  t.equal(get.static('ignore'), null, 'Got back correct value: null')
  t.notOk(get.static('idk'), 'Did not get back nonexistent setting')
})

test('Get @tables', t => {
  t.plan(4)
  t.ok(get.tables, 'Got @tables getter')
  t.ok(get.tables('a-table'), 'Got back correct value: a-table')
  t.ok(get.tables('another-table'), 'Got back correct value: another-table')
  t.notOk(get.tables('idk'), 'Did not get back nonexistent stream')
})

test('Get @tables-indexes', t => {
  t.plan(4)
  t.ok(get['tables-indexes'], 'Got @tables-indexes getter')
  t.equal(get['tables-indexes']('a-table').length, 2, 'Got back correct values: a-table')
  t.equal(get['tables-indexes']('another-table').length, 1, 'Got back correct values: another-table')
  t.notOk(get['tables-indexes']('yet-another-table'), 'Did not get back nonexistent index')
})

test('Get @tables-streams', t => {
  t.plan(4)
  t.ok(get['tables-streams'], 'Got @tables-streams getter')
  t.ok(get['tables-streams']('a-stream'), 'Got back correct value: a-stream')
  t.ok(get['tables-streams']('another-stream'), 'Got back correct value: another-stream')
  t.notOk(get['tables-streams']('idk'), 'Did not get back nonexistent stream')
})

test('Get @views', t => {
  t.plan(4)
  t.ok(get.views, 'Got @views getter')
  t.ok(get.views('src'), 'Got back correct value: src')
  t.ok(get.views('views'), 'Got back correct value: views')
  t.notOk(get.views('idk'), 'Did not get back nonexistent setting')
})

test('Get @ws', t => {
  t.plan(6)
  t.ok(get.ws, 'Got @ws getter')
  t.ok(get.ws('connect'), 'Got back correct value: connect')
  t.ok(get.ws('default'), 'Got back correct value: default')
  t.ok(get.ws('disconnect'), 'Got back correct value: disconnect')
  t.ok(get.ws('some-ws-route'), 'Got back correct value: some-ws-route')
  t.notOk(get.ws('idk'), 'Did not get back nonexistent WebSocket route')
})

/**
 * Static mode (which has nothing but @app + @static)
 */
test('Set up static inventory', t => {
  t.plan(1)
  inventory({ cwd: join(mock, 'static') }, (err, result) => {
    if (err) t.fail(err)
    else {
      get = getter(result.inv)
      t.ok(get, 'Got getter')
    }
  })
})

test('Get @app', t => {
  t.plan(2)
  t.ok(get.app, 'Got @app getter')
  t.equal(get.app(), 'static', 'Got back correct value: static')
})

test('Get @aws', t => {
  t.plan(4)
  t.ok(get.aws, 'Got @aws getter')
  t.equal(get.aws('region'), 'us-west-2', 'Got back correct value (default): us-west-2')
  t.equal(get.aws('profile'), null, 'Got back correct value: null')
  t.notOk(get.aws('idk'), 'Did not get back nonexistent setting')
})

test('Get @cdn', t => {
  t.plan(2)
  t.ok(get.cdn, 'Got @cdn getter')
  t.notOk(get.cdn(), 'Got back CDN setting')
})

test('Get @events', t => {
  t.plan(2)
  t.ok(get.events, 'Got @events getter')
  t.notOk(get.events('an-event'), 'Did not get back nonexistent event')
})

test('Get @http', t => {
  t.plan(3)
  t.ok(get.http, 'Got @http getter')
  t.notOk(get.http('get /*'), 'Did not get back ASAP handler: get /*')
  t.notOk(get.http('put /some-put'), 'Did not get back nonexistent route')
})

/* test('Get @macros', t => {
  t.plan(2)
  t.ok(get.macros, 'Got @macros getter')
  t.notOk(get.macros('idk'), 'Did not get back nonexistent macro')
}) */

// TODO add @plugins

test('Get @proxy', t => {
  t.plan(2)
  t.ok(get.proxy, 'Got @proxy getter')
  t.notOk(get.proxy('testing'), 'Did not get back nonexistent setting')
})

test('Get @queues', t => {
  t.plan(2)
  t.ok(get.queues, 'Got @queues getter')
  t.notOk(get.queues('idk'), 'Did not get back nonexistent queue')
})

test('Get @scheduled', t => {
  t.plan(2)
  t.ok(get.scheduled, 'Got @scheduled getter')
  t.notOk(get.scheduled('idk'), 'Did not get back nonexistent scheduled event')
})

test('Get @static', t => {
  t.plan(5)
  t.ok(get.static, 'Got @static getter')
  t.equal(get.static('folder'), 'public', 'Got back correct value (default): public')
  t.equal(get.static('spa'), false, 'Got back correct value (default): false')
  t.equal(get.static('ignore'), null, 'Got back correct value: null')
  t.notOk(get.static('idk'), 'Did not get back nonexistent setting')
})

test('Get @tables', t => {
  t.plan(2)
  t.ok(get.tables, 'Got @tables getter')
  t.notOk(get.tables('idk'), 'Did not get back nonexistent stream')
})

test('Get @tables-streams', t => {
  t.plan(2)
  t.ok(get['tables-streams'], 'Got @tables-streams getter')
  t.notOk(get['tables-streams']('idk'), 'Did not get back nonexistent stream')
})

test('Get @views', t => {
  t.plan(2)
  t.ok(get.views, 'Got @views getter')
  t.notOk(get.views('put /some-put'), 'Did not get back nonexistent setting')
})

test('Get @ws', t => {
  t.plan(2)
  t.ok(get.ws, 'Got @ws getter')
  t.notOk(get.ws('idk'), 'Did not get back nonexistent WebSocket route')
})

test('Return undefined', t => {
  t.plan(1)
  // FYI: this is kind of only for custom pragmas, which aren't implemented in inv
  let get = getter({ foo: 12345 })
  t.equal(get.foo(), undefined, 'Undefined pragma returns undefined')
})
