let lambdaPragmas = require('../../defaults/lambda-pragmas')

module.exports = function collectSourceDirs ({ pragmas }) {
  let srcDirs = []
  Object.entries(pragmas).forEach(([ pragma, values ]) => {
    let mayHaveSrcDirs = lambdaPragmas.some(p => p === pragma)
    if (mayHaveSrcDirs && Array.isArray(values)) {
      pragmas[pragma].forEach(item => {
        if (item.src && typeof item.src === 'string') srcDirs.push(item.src)
        else if (item.explicit === false && item.src === null) return // Special exception for $default handler
        else throw Error(`Lambda is missing source directory: ${JSON.stringify(item, null, 2)}`)
      })
    }
  })
  srcDirs = srcDirs.length ? srcDirs.sort() : null
  return srcDirs
}
