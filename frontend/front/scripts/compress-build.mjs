import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) visit(file)
    else if (/\.(js|css|svg)$/.test(file))
      fs.writeFileSync(file + '.gz', gzipSync(fs.readFileSync(file), { level: 9 }))
  }
}
visit('dist')
