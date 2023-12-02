let { httpMethods } = require('../../../lib')

/**
 * HTTP route sorter; this is a multifurcating tree, so we'll do a few passes
 * Broadly in the theme of most to least specific:
 * - First, by method, with `any` last
 * - Then by path depth (descending)
 * - Within each depth downrank for contained params
 * - Then sort alphabetically
 * - Then, ensure trailing captures are last
 * - Finally, ensure root captures rank below a root literal
 */
module.exports = function sortHTTP (http) {
  let param = /\/:/

  // Construct the tree from HTTP methods
  let tree = {}
  http.forEach(({ method, path }) => {
    if (!tree[method]) tree[method] = []
    let parts = path.split('/').filter(Boolean)
    let depth = parts.length
    let item = { depth, path, parts, hasParam: param.test(path) }
    if (parts.length) {
      if (parts[depth - 1] === '*') item.trailingCapture = 'catchall'
      if (parts[depth - 1].startsWith(':')) item.trailingCapture = 'param'
    }
    tree[method].push(item)
  })

  // Multi-pass route sort
  let sorted = []
  httpMethods.forEach(method => {
    if (!tree[method]) return
    /* istanbul ignore next: random test shuffles may not trigger all paths */
    tree[method]
      // Sort by depth
      .sort((a, b) => b.depth - a.depth)
      // Sort within a given depth
      .sort((a, b) => {
        // Depth is already correct
        if (a.depth - b.depth < 0) return
        // jic we aren't in the same depth (this prob won't be run)
        if (a.depth !== b.depth) return b.depth - a.depth
        // Sort static parts vs  params by position in path
        if (a.hasParam || b.hasParam) {
          for (let i = 0; i < a.depth; i++) {
            let aPart = a.parts[i]
            let bPart = b.parts[i]
            let aPartIsParam = aPart.startsWith(':')
            let bPartIsParam = bPart.startsWith(':')
            // If position is both params, move onto the next position
            if (aPartIsParam && bPartIsParam) continue
            // Static parts get priority over params
            if (aPartIsParam) return 1
            if (bPartIsParam) return -1
            // Sort alphabetically
            if (aPart < bPart) return -1
            if (aPart > bPart) return 1
          }
        }
        // Final alphabetical sort
        if (a.path < b.path) return -1
        if (a.path > b.path) return 1
      })
      // Trailing capture sort
      .sort((a, b) => {
        if (!a.depth && b.depth === 1 && b.trailingCapture) return -1
        if (a.depth - b.depth < 0) return
        if (a.depth === b.depth &&
            a.trailingCapture && b.trailingCapture) {
          if (a.trailingCapture === b.trailingCapture) return
          if (a.trailingCapture === 'param' && b.trailingCapture === 'catchall') return -1
          return 1
        }
        if (a.trailingCapture) return 1
        if (b.trailingCapture) return -1
      })
    tree[method].forEach(({ path }) => {
      let route = http.find(i => i.method === method && i.path === path)
      sorted.push(route)
    })
  })

  return sorted
}
