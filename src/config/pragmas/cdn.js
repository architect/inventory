module.exports = function configureCDN ({ arc, errors }) {
  if (arc.cdn && !arc.http) {
    errors.push('@cdn requires @http')
    return null
  }
  if (!arc.cdn || !arc.http) return null

  let cdn
  if (arc.cdn === true) cdn = true
  else if (Array.isArray(arc.cdn)) {
    let disabled = [ false, 'disable', 'disabled' ]
    let isDisabled = disabled.some(s => s === arc.cdn[0])
    if (isDisabled) cdn = false
    else cdn = true
  }

  return cdn
}
