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
custom-pubsub-cjs
custom-pubsub-esm
rando

@pubsub-cjs
channel-one
channel-two

@pubsub-esm
channel-three
channel-four
