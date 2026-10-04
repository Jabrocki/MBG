import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

// Preview serves the existing deployment. Only fingerprinted assets receive long caching.
function compressedPreview(): Plugin {
  return {
    name: 'mbg-compressed-preview',
    configurePreviewServer(server) {
      const output = resolve(server.config.root, server.config.build.outDir)
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next()
        const asset = new URL(req.url ?? '/', 'http://localhost').pathname
        const hashed = /^\/assets\/[A-Za-z0-9_-]+\.(js|css)$/.test(asset)
        if (!hashed && asset !== '/mbg-icons.svg') return next()
        const acceptsGzip = (req.headers['accept-encoding'] ?? '').split(',').some((part) => {
          const [encoding, quality] = part.trim().split(';')
          return encoding === 'gzip' && !/^\s*q=0(?:\.0*)?\s*$/.test(quality ?? '')
        })
        const file = resolve(output, '.' + asset + (acceptsGzip ? '.gz' : ''))
        if (!existsSync(file)) return next()
        res.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache')
        res.setHeader('Vary', 'Origin, Accept-Encoding')
        if (acceptsGzip) res.setHeader('Content-Encoding', 'gzip')
        res.setHeader(
          'Content-Type',
          asset.endsWith('.js')
            ? 'text/javascript'
            : asset.endsWith('.css')
              ? 'text/css'
              : 'image/svg+xml',
        )
        res.setHeader('Content-Length', statSync(file).size)
        if (req.method === 'HEAD') return res.end()
        createReadStream(file)
          .on('error', () => res.destroy())
          .pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), compressedPreview()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
