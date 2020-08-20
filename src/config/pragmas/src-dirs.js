module.exports = function collectSourceDirs ({ inventory }) {
  let srcDirs = []
  Object.entries(inventory).forEach(([ pragma, values ]) => {
    if (Array.isArray(values)) {
      inventory[pragma].forEach(item => {
        if (item.src) srcDirs.push(item.src)
      })
    }
  })
  srcDirs = srcDirs.length ? srcDirs.sort() : null
  return srcDirs
}
