const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const dist = path.join(__dirname, '..', 'dist')

for (const base of ['commit', 'header', 'template', 'footer']) {
  // Collect all variants: base.hbs, base1.hbs, base2.hbs, ...
  const files = fs.readdirSync(dist)
    .filter(f => f.match(new RegExp(`^${base}\\d*\\.hbs$`)))
    .map(f => ({
      name: f,
      content: fs.readFileSync(path.join(dist, f), 'utf-8'),
    }))

  if (files.length <= 1) continue

  // Sort by content hash for deterministic ordering
  files.sort((a, b) => {
    const ha = crypto.createHash('sha1').update(a.content).digest('hex')
    const hb = crypto.createHash('sha1').update(b.content).digest('hex')
    return ha.localeCompare(hb)
  })

  // Build new names: base.hbs, base1.hbs, base2.hbs, ...
  const newNames = files.map((_, i) => i === 0 ? `${base}.hbs` : `${base}${i}.hbs`)

  // Read index.js
  let indexJs = fs.readFileSync(path.join(dist, 'index.js'), 'utf-8')

  // Use placeholders to avoid conflicts during rename
  files.forEach((f, i) => {
    indexJs = indexJs.split(f.name).join(`__PLACEHOLDER_${base}_${i}__`)
  })
  newNames.forEach((name, i) => {
    indexJs = indexJs.split(`__PLACEHOLDER_${base}_${i}__`).join(name)
  })

  // Write renamed files
  files.forEach((f, i) => {
    fs.writeFileSync(path.join(dist, newNames[i]), f.content)
  })

  // Clean up old names that are no longer used
  files.forEach(f => {
    if (!newNames.includes(f.name)) {
      try { fs.unlinkSync(path.join(dist, f.name)) } catch {}
    }
  })

  fs.writeFileSync(path.join(dist, 'index.js'), indexJs)
}
