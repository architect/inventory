let { join } = require('node:path')
let { test } = require('node:test')
let inventory = require('../../../')
let getter = require('../../../src/get')

let mock = join(process.cwd(), 'test', 'mock')

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(getter, 'Getter is present')
})

// This test assumes that the bits of inventory running here remain sync
// Should anything go async, this test may exhibit wonky behavior!
let get

/**
 * Max mode
 */
test('Set up max inventory', async t => {
  t.plan(1)
  let result = await inventory({ cwd: join(mock, 'max') })
  get = getter(result.inv)
  t.assert.ok(get, 'Got getter')
})

test('Get @app', t => {
  t.plan(2)
  t.assert.ok(get.app, 'Got @app getter')
  t.assert.equal(get.app(), 'maxed-out', 'Got back correct value: maxed-out')
})

test('Get @aws', t => {
  t.plan(4)
  t.assert.ok(get.aws, 'Got @aws getter')
  t.assert.equal(get.aws('region'), 'us-west-1', 'Got back correct value: us-west-1')
  t.assert.equal(get.aws('profile'), null, 'Got back correct value: null')
  t.assert.ok(!get.aws('idk'), 'Did not get back nonexistent setting')
})

test('Get @cdn', t => {
  t.plan(2)
  t.assert.ok(get.cdn, 'Got @cdn getter')
  t.assert.ok(get.cdn(), 'Got back CDN setting')
})

test('Get @events', t => {
  t.plan(4)
  t.assert.ok(get.events, 'Got @events getter')
  t.assert.ok(get.events('an-event'), 'Got back correct value: an-event')
  t.assert.ok(get.events('another-event'), 'Got back correct value: another-event')
  t.assert.ok(!get.events('some-event'), 'Did not get back nonexistent event')
})

test('Get @http', t => {
  t.plan(4)
  t.assert.ok(get.http, 'Got @http getter')
  t.assert.ok(get.http('get /'), 'Got back correct value: get /')
  t.assert.ok(get.http('put /some-put'), 'Got back correct value: put /some-put')
  t.assert.ok(!get.http('get /nope'), 'Did not get back nonexistent route')
})

test('Get @plugins', t => {
  t.plan(4)
  t.assert.ok(get.plugins, 'Got @plugins getter')
  t.assert.ok(get.plugins('prune'), 'Got back correct value: prune (originally an @macro)')
  t.assert.ok(get.plugins('something'), 'Got back correct value (actually am @plugin): something')
  t.assert.ok(!get.plugins('idk'), 'Did not get back nonexistent plugin')
})

test('Get @proxy', t => {
  t.plan(4)
  t.assert.ok(get.proxy, 'Got @proxy getter')
  t.assert.ok(get.proxy('testing'), 'Got back correct value: testing')
  t.assert.ok(get.proxy('staging'), 'Got back correct value: staging')
  t.assert.ok(!get.proxy('idk'), 'Did not get back nonexistent setting')
})

test('Get @queues', t => {
  t.plan(4)
  t.assert.ok(get.queues, 'Got @queues getter')
  t.assert.ok(get.queues('a-queue'), 'Got back correct value: a-queue')
  t.assert.ok(get.queues('another-queue'), 'Got back correct value: another-queue')
  t.assert.ok(!get.queues('idk'), 'Did not get back nonexistent queue')
})

test('Get @scheduled', t => {
  t.plan(6)
  t.assert.ok(get.scheduled, 'Got @scheduled getter')
  t.assert.ok(get.scheduled('rate-scheduled-simple'), 'Got back correct value: rate-scheduled-simple')
  t.assert.ok(get.scheduled('cron-scheduled-simple'), 'Got back correct value: cron-scheduled-simple')
  t.assert.ok(get.scheduled('rate-scheduled-complex'), 'Got back correct value: rate-scheduled-complex')
  t.assert.ok(get.scheduled('rate-scheduled-complex'), 'Got back correct value: rate-scheduled-complex')
  t.assert.ok(!get.scheduled('idk'), 'Did not get back nonexistent scheduled event')
})

test('Get @shared', t => {
  t.plan(4)
  t.assert.ok(get.shared, 'Got @shared getter')
  t.assert.ok(get.shared('src'), 'Got back correct value: src')
  t.assert.ok(get.shared('shared'), 'Got back correct value: shared')
  t.assert.ok(!get.shared('idk'), 'Did not get back nonexistent setting')
})

test('Get @static', t => {
  t.plan(4)
  t.assert.ok(get.static, 'Got @static getter')
  t.assert.equal(get.static('folder'), 'some-folder', 'Got back correct value: some-folder')
  t.assert.equal(get.static('ignore'), null, 'Got back correct value: null')
  t.assert.ok(!get.static('idk'), 'Did not get back nonexistent setting')
})

test('Get @tables', t => {
  t.plan(4)
  t.assert.ok(get.tables, 'Got @tables getter')
  t.assert.ok(get.tables('a-table'), 'Got back correct value: a-table')
  t.assert.ok(get.tables('another-table'), 'Got back correct value: another-table')
  t.assert.ok(!get.tables('idk'), 'Did not get back nonexistent stream')
})

test('Get @tables-indexes', t => {
  t.plan(4)
  t.assert.ok(get['tables-indexes'], 'Got @tables-indexes getter')
  t.assert.equal(get['tables-indexes']('a-table').length, 2, 'Got back correct values: a-table')
  t.assert.equal(get['tables-indexes']('another-table').length, 1, 'Got back correct values: another-table')
  t.assert.ok(!get['tables-indexes']('yet-another-table'), 'Did not get back nonexistent index')
})

test('Get @tables-streams', t => {
  t.plan(4)
  t.assert.ok(get['tables-streams'], 'Got @tables-streams getter')
  t.assert.ok(get['tables-streams']('a-stream'), 'Got back correct value: a-stream')
  t.assert.ok(get['tables-streams']('another-stream'), 'Got back correct value: another-stream')
  t.assert.ok(!get['tables-streams']('idk'), 'Did not get back nonexistent stream')
})

test('Get @views', t => {
  t.plan(4)
  t.assert.ok(get.views, 'Got @views getter')
  t.assert.ok(get.views('src'), 'Got back correct value: src')
  t.assert.ok(get.views('views'), 'Got back correct value: views')
  t.assert.ok(!get.views('idk'), 'Did not get back nonexistent setting')
})

test('Get @ws', t => {
  t.plan(6)
  t.assert.ok(get.ws, 'Got @ws getter')
  t.assert.ok(get.ws('connect'), 'Got back correct value: connect')
  t.assert.ok(get.ws('default'), 'Got back correct value: default')
  t.assert.ok(get.ws('disconnect'), 'Got back correct value: disconnect')
  t.assert.ok(get.ws('some-ws-route'), 'Got back correct value: some-ws-route')
  t.assert.ok(!get.ws('idk'), 'Did not get back nonexistent WebSocket route')
})

/**
 * Static mode (which has nothing but @app + @static)
 */
test('Set up static inventory', async t => {
  t.plan(1)
  let result = await inventory({ cwd: join(mock, 'static') })
  get = getter(result.inv)
  t.assert.ok(get, 'Got getter')
})

test('Get @app', t => {
  t.plan(2)
  t.assert.ok(get.app, 'Got @app getter')
  t.assert.equal(get.app(), 'static', 'Got back correct value: static')
})

test('Get @aws', t => {
  t.plan(4)
  t.assert.ok(get.aws, 'Got @aws getter')
  t.assert.equal(get.aws('region'), 'us-west-2', 'Got back correct value (default): us-west-2')
  t.assert.equal(get.aws('profile'), null, 'Got back correct value: null')
  t.assert.ok(!get.aws('idk'), 'Did not get back nonexistent setting')
})

test('Get @cdn', t => {
  t.plan(2)
  t.assert.ok(get.cdn, 'Got @cdn getter')
  t.assert.ok(!get.cdn(), 'Got back CDN setting')
})

test('Get @events', t => {
  t.plan(2)
  t.assert.ok(get.events, 'Got @events getter')
  t.assert.ok(!get.events('an-event'), 'Did not get back nonexistent event')
})

test('Get @http', t => {
  t.plan(3)
  t.assert.ok(get.http, 'Got @http getter')
  t.assert.ok(!get.http('get /*'), 'Did not get back ASAP handler: get /*')
  t.assert.ok(!get.http('put /some-put'), 'Did not get back nonexistent route')
})

test('Get @plugins', t => {
  t.plan(2)
  t.assert.ok(get.plugins, 'Got @plugins getter')
  t.assert.ok(!get.plugins('idk'), 'Did not get back nonexistent plugin')
})

test('Get @proxy', t => {
  t.plan(2)
  t.assert.ok(get.proxy, 'Got @proxy getter')
  t.assert.ok(!get.proxy('testing'), 'Did not get back nonexistent setting')
})

test('Get @queues', t => {
  t.plan(2)
  t.assert.ok(get.queues, 'Got @queues getter')
  t.assert.ok(!get.queues('idk'), 'Did not get back nonexistent queue')
})

test('Get @scheduled', t => {
  t.plan(2)
  t.assert.ok(get.scheduled, 'Got @scheduled getter')
  t.assert.ok(!get.scheduled('idk'), 'Did not get back nonexistent scheduled event')
})

test('Get @static', t => {
  t.plan(5)
  t.assert.ok(get.static, 'Got @static getter')
  t.assert.equal(get.static('folder'), 'public', 'Got back correct value (default): public')
  t.assert.equal(get.static('spa'), false, 'Got back correct value (default): false')
  t.assert.equal(get.static('ignore'), null, 'Got back correct value: null')
  t.assert.ok(!get.static('idk'), 'Did not get back nonexistent setting')
})

test('Get @tables', t => {
  t.plan(2)
  t.assert.ok(get.tables, 'Got @tables getter')
  t.assert.ok(!get.tables('idk'), 'Did not get back nonexistent stream')
})

test('Get @tables-streams', t => {
  t.plan(2)
  t.assert.ok(get['tables-streams'], 'Got @tables-streams getter')
  t.assert.ok(!get['tables-streams']('idk'), 'Did not get back nonexistent stream')
})

test('Get @views', t => {
  t.plan(2)
  t.assert.ok(get.views, 'Got @views getter')
  t.assert.ok(!get.views('put /some-put'), 'Did not get back nonexistent setting')
})

test('Get @ws', t => {
  t.plan(2)
  t.assert.ok(get.ws, 'Got @ws getter')
  t.assert.ok(!get.ws('idk'), 'Did not get back nonexistent WebSocket route')
})

test('Return undefined', t => {
  t.plan(1)
  // FYI: this is kind of only for custom pragmas, which aren't implemented in inv
  let get = getter({ foo: 12345 })
  t.assert.equal(get.foo(), undefined, 'Undefined pragma returns undefined')
})
