module.exports = function collectSourceDirs ({ inventory }) {
  let srcDirs = []
  Object.entries(inventory).forEach(([ pragma, values ]) => {
    if (Array.isArray(values)) {
      inventory[pragma].forEach(item => {
        if (item.srcDir) srcDirs.push(item.srcDir)
      })
    }
  })
  srcDirs = srcDirs.length ? srcDirs.sort() : null
  return srcDirs
}
