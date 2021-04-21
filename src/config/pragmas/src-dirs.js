let lambdaPragmas = require('../../defaults/lambda-pragmas')

module.exports = function collectSourceDirs ({ pragmas }) {
  let lambdaSrcDirs = []
  let unsortedBySrcDir = {}
  Object.entries(pragmas).forEach(([ pragma, values ]) => {
    let mayHaveSrcDirs = lambdaPragmas.some(p => p === pragma)
    if (mayHaveSrcDirs && Array.isArray(values)) {
      pragmas[pragma].forEach(item => {
        if (item.arcStaticAssetProxy === true) return // Special exception for ASAP
        else if (typeof item.src === 'string') {
          lambdaSrcDirs.push(item.src)
          // Multiple Lambdae may map to a single dir
          if (unsortedBySrcDir[item.src]) {
            unsortedBySrcDir[item.src] = Array.isArray(unsortedBySrcDir[item.src])
              ? [ ...unsortedBySrcDir[item.src], { ...item, pragma } ]
              : [ unsortedBySrcDir[item.src], { ...item, pragma } ]
          }
          else unsortedBySrcDir[item.src] = { ...item, pragma }
        }
        else throw Error(`Lambda is missing source directory: ${JSON.stringify(item, null, 2)}`)
      })
    }
  })

  // Dedupe multiple Lambdae sharing the same folder
  lambdaSrcDirs = lambdaSrcDirs.length ? [ ...new Set(lambdaSrcDirs) ].sort() : null

  // Sort the object for human readability
  let lambdasBySrcDir = null
  unsortedBySrcDir = Object.keys(unsortedBySrcDir).length ? unsortedBySrcDir : null
  if (unsortedBySrcDir) {
    lambdasBySrcDir = {}
    lambdaSrcDirs.forEach(d => lambdasBySrcDir[d] = unsortedBySrcDir[d])
  }

  return { lambdaSrcDirs, lambdasBySrcDir }
}
