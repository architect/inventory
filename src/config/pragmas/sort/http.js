let methods = require('../../../lib/http-methods')

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
  // Construct the tree from HTTP methods
  let tree = {}
  http.forEach(({ method, path }) => {
    if (!tree[method]) tree[method] = []
    let parts = path.split('/').filter(Boolean)
    let depth = parts.length
    let item = { depth, path }
    let param = /\/:/
    if (path.match(param)) {
      item.hasParam = true
      item.paramIndex = path.match(param).index // If multiple, we want the earliest
    }
    if (parts.length) {
      if (parts[depth - 1] === '*') item.trailingCapture = 'catchall'
      if (parts[depth - 1].startsWith(':')) item.trailingCapture = 'param'
    }
    tree[method].push(item)
  })

  // Multi-pass route sort
  let sorted = []
  methods.forEach(method => {
    if (!tree[method]) return
    /* istanbul ignore next: random test shuffles may not trigger all paths */
    tree[method]
      // Sort by depth
      .sort((a, b) => b.depth - a.depth)
      // Sort within a given depth
      .sort((a, b) => {
        // Handle root (depth: 0)
        if (a.depth - b.depth < 0) return
        if (a.hasParam && b.hasParam) {
          // Sort at the earliest param
          if (a.paramIndex < b.paramIndex) return 1
          if (a.paramIndex > b.paramIndex) return -1
          // Then sort alphabetically
          if (a.path < b.path) return -1
          if (a.path > b.path) return 1
        }
        if (a.hasParam) return 1
        if (b.hasParam) return -1
        if (a.path < b.path) return -1
        if (a.path > b.path) return 1
      })
      // Trailing capture sort
      .sort((a, b) => {
        if (!a.depth && b.depth === 1 && b.trailingCapture) return -1
        if (a.depth - b.depth < 0) return
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
