// Canonical runtime list: https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
// Array order matters, newest (or most preferable) must always be at the top
let runtimes = {
  node: [
    'nodejs14.x',
    'nodejs12.x',
    'nodejs10.x',
  ],
  python: [
    'python3.9',
    'python3.8',
    'python3.7',
    'python3.6',
    'python2.7',
  ],
  ruby: [
    'ruby2.7',
    'ruby2.5',
  ],
  java: [
    'java11',
    'java8.al2',
    'java8',
  ],
  go: [
    'go1.x',
  ],
  dotnet: [
    'dotnetcore3.1',
    'dotnetcore2.1',
  ],
  custom: [
    'provided.al2',
    'provided',
  ]
}

// Human friendly shortcuts
let nodes = [ 'node', 'nodejs', 'node.js' ]
let pythons = [ 'python', 'py' ]
let rubies = [ 'ruby', 'rb' ]
let javas = [ 'java' ]
let gos = [ 'go', 'golang' ]
let dotnets = [ 'dotnet', '.net' ]
let customs = [ 'custom' ]

// Runtime interpolater
function getRuntime (name) {
  if (typeof name === 'string') {
    name = name.toLowerCase()

    if (nodes.includes(name))             return runtimes.node[0]
    if (runtimes.node.includes(name))     return name

    if (pythons.includes(name))           return runtimes.python[0]
    if (runtimes.python.includes(name))   return name

    if (rubies.includes(name))            return runtimes.ruby[0]
    if (runtimes.ruby.includes(name))     return name

    if (javas.includes(name))             return runtimes.java[0]
    if (runtimes.java.includes(name))     return name

    if (gos.includes(name))               return runtimes.go[0]
    if (runtimes.go.includes(name))       return name

    if (dotnets.includes(name))           return runtimes.dotnet[0]
    if (runtimes.dotnet.includes(name))   return name

    if (customs.includes(name))           return runtimes.custom[0]
    if (runtimes.custom.includes(name))   return name

    return name // Will be validated later
  }
}

getRuntime.runtimes = runtimes
module.exports = getRuntime
