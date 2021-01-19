@app
macro-lambda

@aws
region us-west-1

@http
get /
/some-put
  src some-put
  method put

@macros
custom-pubsub

@pubsub
channel-one
channel-two
