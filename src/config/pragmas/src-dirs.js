module.exports = function collectSourceDirs ({ pragmas }) {
  let srcDirs = []
  Object.entries(pragmas).forEach(([ pragma, values ]) => {
    if (Array.isArray(values)) {
      pragmas[pragma].forEach(item => {
        if (item.src) srcDirs.push(item.src)
        else throw Error(`Lambda is missing source directory: ${item}`)
      })
    }
  })
  srcDirs = srcDirs.length ? srcDirs.sort() : null
  return srcDirs
}
