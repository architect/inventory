let parse = require('@architect/parser')
let parser = parse
let { existsSync: exists, readFileSync } = require('fs')
let { join } = require('path')
let read = p => readFileSync(p).toString()

/**
 * Look up a set of files in various formats and parse them, depending on type
 *
 * @param {object} reads - object containing order-specific arrays of filenames to check
 * @param {string} cwd - absolute path to current working directory
 * @returns {object} { arc, raw, filepath }
 */
module.exports = function reader (reads, cwd) {
  let filepath = false
  let raw = null
  let arc = null

  Object.entries(reads).forEach(([ type, value ]) => {
    // Bail if we found something
    if (filepath) return

    // Crawl the specified files; _default assumes a string
    if (Array.isArray(value)) {
      value.forEach(f => {
        // Again, bail if we found something
        if (filepath) return

        let file = join(cwd, f)
        if (exists(file)) {
          filepath = file
          raw = read(file)
          // TODO add handling for empty/munged files I guess
          arc = type === 'arc'
            ? parser(raw)
            : parse[type](raw) // Parser has convenient json, yaml, toml methods!
        }
      })
    }

    // Allow for a default backup
    if (type === '_default' && !filepath) {
      raw = value
      arc = parser(raw)
    }
  })

  return { arc, raw, filepath }
}
