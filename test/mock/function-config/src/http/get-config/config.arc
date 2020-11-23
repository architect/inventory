# Non-defaults all around
@aws
runtime nodejs8.10 # No longer supported
timeout 10
memory 128
layers
  arn:a:b:us-west-1:c:d:e:f
policies
  arn:b:c:us-west-1:d:e:f:g

@arc
shared false
env false
views false
