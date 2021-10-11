module.exports = function configureCDN ({ arc, errors }) {
  if (arc.cdn && !arc.http) {
    errors.push('@cdn requires @http')
    return null
  }
  if (!arc.cdn || !arc.http) return null

  let cdn = true
  arc.cdn.forEach(setting => {
    let disabled = [ false, 'disable', 'disabled' ]
    let isDisabled = disabled.includes(setting)
    if (isDisabled) cdn = false
  })

  return cdn
}
