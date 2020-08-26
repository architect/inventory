let { parser, lexer, json, yaml, toml } = require('@architect/parser')
let { existsSync: exists, readFileSync } = require('fs')
let { join } = require('path')

let read = p => readFileSync(p).toString()

let defaultArc = `@app
app-default

@static

@http
`

/**
 * Look up app.arc falling back to: .arc, arc.json, arc.yaml, arc.yml, arc.toml
 *
 * @param {object} params
 * @param {string} params.cwd - path to current working directory (process.cwd() used if not defined)
 * @returns {object} {arc, raw, filepath}
 */
module.exports = function readArc ({ cwd }) {
  let arcDefaultPath =  join(cwd, 'app.arc')
  let dotArcPath =      join(cwd, '.arc')
  let arcJsonPath =     join(cwd, 'arc.json')
  let arcYamlPath =     join(cwd, 'arc.yaml')
  let arcYmlPath =      join(cwd, 'arc.yml')
  let arcTomlPath =     join(cwd, 'arc.toml')

  let raw
  let arc
  let filepath

  if (exists(arcDefaultPath)) {
    filepath = arcDefaultPath
    raw = read(arcDefaultPath)
    arc = parser(lexer(raw))
  }
  else if (exists(dotArcPath)) {
    filepath = dotArcPath
    raw = read(dotArcPath)
    arc = parser(lexer(raw))
  }
  else if (exists(arcJsonPath)) {
    filepath = arcJsonPath
    raw = read(arcJsonPath)
    arc = json(raw)
  }
  else if (exists(arcYamlPath)) {
    filepath = arcYamlPath
    raw = read(arcYamlPath)
    arc = yaml(raw)
  }
  else if (exists(arcYmlPath)) {
    filepath = arcYmlPath
    raw = read(arcYmlPath)
    arc = yaml(raw)
  }
  else if (exists(arcTomlPath)) {
    filepath = arcTomlPath
    raw = read(arcTomlPath)
    arc = toml(raw)
  }
  else {
    filepath = false
    raw = defaultArc
    arc = parser(lexer(raw))
  }

  return { arc, raw, filepath }
}
