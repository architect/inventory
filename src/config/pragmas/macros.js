module.exports = function configureMacros ({ arc }) {
  if (!arc.macros || !arc.macros.length) return null

  return arc.macros
}
