let { is, pragmas } = require('../../../lib')
let { lambdas } = pragmas

module.exports = function collectSourceDirs ({ pragmas, errors }) {
  let lambdaSrcDirs = []
  let unsortedBySrcDir = {}
  Object.entries(pragmas).forEach(([ pragma, values ]) => {
    let mayHaveSrcDirs = lambdas.includes(pragma) || pragma === 'customLambdas'
    if (mayHaveSrcDirs && is.array(values)) {
      pragmas[pragma].forEach(item => {
        if (item.arcStaticAssetProxy === true) return // Special exception for ASAP
        else if (is.string(item.src)) {
          lambdaSrcDirs.push(item.src)
          // Multiple Lambdae may map to a single dir
          // >2 Lambdas found with same src dir
          if (is.array(unsortedBySrcDir[item.src])) {
            unsortedBySrcDir[item.src].push(item)
          }
          // 2 Lambdas found with same src dir
          else if (is.object(unsortedBySrcDir[item.src])) {
            unsortedBySrcDir[item.src] = [ unsortedBySrcDir[item.src], item ]
          }
          // 1 Lambda found
          else unsortedBySrcDir[item.src] = item
        }
        else errors.push(`Lambda is missing source directory: ${JSON.stringify(item, null, 2)}`)
      })
    }
  })

  // Dedupe multiple Lambdae sharing the same folder
  lambdaSrcDirs = lambdaSrcDirs.length ? [ ...new Set(lambdaSrcDirs) ].sort() : null

  // Sort the object for human readability
  let lambdasBySrcDir = null
  if (Object.keys(unsortedBySrcDir).length) {
    lambdasBySrcDir = {}
    lambdaSrcDirs.forEach(d => lambdasBySrcDir[d] = unsortedBySrcDir[d])
  }

  return { lambdaSrcDirs, lambdasBySrcDir }
}
