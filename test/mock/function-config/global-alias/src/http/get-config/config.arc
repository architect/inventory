# Non-defaults all around
@aws
runtime nodejs14.x
timeout 10
memory 128
storage 1337
layers
  arn:a:b:us-west-1:c:d:e:f
policies
  arn:b:c:us-west-1:d:e:f:g
architecture arm64

@arc
shared false
env false
views false
