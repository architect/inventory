@app
maxed-out

@aws
region us-west-1

@cdn

@events
an-event
another-event
  src another-event

@http
get /
/some-put
  src some-put
  method put

@indexes
a-table
  idk *String
a-table
  irdk *String
another-table
  idk *String

@macros
architect/node-prune

@proxy
testing http://testing.site
staging http://staging.site
production http://production.site

@queues
a-queue
another-queue
  src another-queue

@scheduled
rate-scheduled-simple rate(1 day)
cron-scheduled-simple cron(0/5 8-17 ? * MON-FRI *)
rate-scheduled-complex
  rate 1 day
  src rate-scheduled-complex
cron-scheduled-complex
  cron 0/5 8-17 ? * MON-FRI *
  src cron-scheduled-complex

@static
folder some-folder
prefix some-prefix

@shared
queues
  a-queue

@streams
a-stream
  table another-table
another-stream
  src another-stream
  table another-table

@tables
a-table
  id *String
  stream true
another-table
  id *Number

@views
put /some-put

@ws
connect
default
disconnect
some-ws-route
