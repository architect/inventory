let parse = require('@architect/parser')
let { existsSync, readFileSync } = require('fs')
let { join } = require('path')
let { is } = require('../lib')
let read = p => readFileSync(p).toString()

/**
 * Look up a set of files in various formats and parse them, depending on type
 *
 * @param {object} reads - object containing order-specific arrays of filenames to check
 * @param {string} cwd - absolute path to current working directory
 * @returns {object} { arc, raw, filepath }
 */
module.exports = function reader (reads, cwd, errors) {
  let filepath = false
  let raw = null
  let arc = null

  Object.entries(reads).forEach(([ type, value ]) => {
    // Bail if we found something
    if (filepath) return

    // Crawl the specified files; _default assumes a string
    if (is.array(value)) {
      value.forEach(f => {
        // Again, bail if we found something
        if (filepath) return

        try {
          // Bail if file doesn't exist
          let file = join(cwd, f)
          if (!existsSync(file)) return

          if (type !== 'manifest') {
            filepath = file
            raw = read(file)
            if (raw.trim() === '') return errors.push(`Empty file: ${f}`)
            arc = type === 'arc'
              ? parse(raw)
              : parse[type](raw) // Parser has convenient json + yaml methods!
          }
          else {
            let pkg = JSON.parse(read(file))
            let foundArc = pkg.arc || pkg.architect
            if (foundArc) {
              filepath = file
              raw = JSON.stringify(foundArc, null, 2)
              arc = parse.json(raw)
            }
          }
        }
        catch (err) {
          errors.push(`Problem reading ${f}: ${err.message}`)
        }
      })
    }

    // Allow for a default backup
    if (type === '_default' && !filepath) {
      raw = value
      arc = parse(raw)
    }
  })

  return { arc, raw, filepath }
}
