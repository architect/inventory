module.exports = function checkFilePaths (inventory, errors) {
  let ascii = /^[ -~]+$/
  let err = str => errors.push(`${str} path must contain only ascii characters`)

  let { _project: proj } = inventory
  if (!ascii.test(proj.cwd)) return err('Project file')
  if (!ascii.test(proj.src)) return err('Project source')
  if (proj.build && !ascii.test(proj.build)) return err('Build')

  let lambdas = inventory.lambdasBySrcDir
  if (lambdas){
    Object.values(lambdas).forEach(lambda => {
      let { name, pragma, src } = lambda
      if (!ascii.test(src)) err(`@${pragma} ${name} source`)
    })
  }
}
