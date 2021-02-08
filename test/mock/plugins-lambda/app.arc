@app
plugins-lambda

@aws
region us-west-1

@http
get /
/some-put
  src some-put
  method put

@plugins
custom-pubsub

@pubsub
channel-one
channel-two
