const fs = require('node:fs'),
  path = require('node:path')
let sharp
try {
  sharp = require('sharp')
} catch {
  sharp = require(
    path.join(
      process.env.MBG_RUNTIME_MODULES ||
        'C:/Users/micha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',
      'sharp',
    ),
  )
}
const root = path.resolve(__dirname, '..'),
  shots = path.join(root, 'mockups/mbg-v3/screenshots'),
  previews = path.join(root, 'public/previews')
fs.mkdirSync(previews, { recursive: true })
const source = fs.readFileSync(path.join(root, 'src/routes.ts'), 'utf8'),
  routes = [...source.matchAll(/\{\s*path: '([^']+)',\s*title: '([^']+)'/g)].map((m) => ({
    path: m[1],
    title: m[2],
  }))
const slug = (route) =>
  route === '/' ? 'landing' : route.split('?')[0].slice(1).replaceAll('/', '-')
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
;(async () => {
  for (const r of routes) {
    const input = path.join(shots, slug(r.path) + '-desktop.png'),
      meta = await sharp(input).metadata()
    await sharp(input)
      .extract({ left: 0, top: 0, width: meta.width, height: Math.min(1000, meta.height) })
      .resize({ width: 600 })
      .webp({ quality: 82 })
      .toFile(path.join(previews, slug(r.path) + '.webp'))
    fs.writeFileSync(
      path.join(previews, slug(r.path) + '.webp.json'),
      JSON.stringify(
        {
          prompt: `Origin: screenshot of the MBG React prototype route ${r.path}; source mockups/mbg-v3/screenshots/${slug(r.path)}-desktop.png, captured with Playwright at 1440x1000, cropped to the first viewport and resized to 600px by scripts/build-gallery.cjs. Not an AI-generated interface.`,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    )
  }
  const cards = routes
    .map(
      (r) =>
        `<article data-title="${escape(r.title.toLowerCase())}"><h2>${escape(r.title)}</h2><p>${escape(r.path)}</p><div class="pair"><a href="screenshots/${slug(r.path)}-desktop.png"><img loading="lazy" src="../../public/previews/${slug(r.path)}.webp" alt="${escape(r.title)} — desktop"/><span>Komputer · 1440 px</span></a><a href="screenshots/${slug(r.path)}-mobile.png"><span class="phone">Telefon · 390 px<br/>Otwórz pełny mockup</span></a></div></article>`,
    )
    .join('')
  const html = `<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>MBG — galeria ${routes.length} ekranów</title><style>body{margin:0;padding:36px;background:#f8f7f2;color:#183c33;font:16px/1.5 system-ui,sans-serif}header{max-width:1050px;margin:0 auto 36px}h1{font-size:42px;line-height:1.15;letter-spacing:-.025em}h2{font-size:23px;line-height:1.25;margin:0}p{color:#56665c}input{padding:14px;width:min(90%,450px);border:1px solid #77867b;border-radius:8px;font:inherit}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:25px;max-width:1250px;margin:auto}article{padding:25px;border:1px solid #d6ddd3;border-radius:12px;background:white}article p{font-size:12px;overflow-wrap:anywhere}.pair{display:grid;grid-template-columns:3fr 1fr;gap:15px}a{color:inherit;text-decoration:none}img{width:100%;border-radius:8px}a span{display:block;font-size:12px;margin-top:10px}.phone{display:flex!important;align-items:center;justify-content:center;text-align:center;background:#e5ebdf;min-height:125px;border-radius:10px;padding:12px}a:focus-visible,input:focus-visible{outline:3px solid #1e40af;outline-offset:4px}@media(max-width:700px){body{padding:25px 18px}main{grid-template-columns:1fr}h1{font-size:32px}article{padding:20px}}[hidden]{display:none}</style><header><h1>Małopolska bez granic.<br/>Wszystkie ekrany w jednym miejscu.</h1><p>${routes.length} widoków × desktop i telefon. Kliknij podgląd, aby otworzyć pełny PNG. Dane i działania są syntetyczne.</p><p>Interaktywny atlas: <a href="http://127.0.0.1:5175/mockupy">otwórz prototyp MBG</a> · <a href="../../public/brand/mbg-logo.svg">logo SVG</a>.</p><label for="search">Znajdź ekran</label><br/><input id="search" placeholder="Nazwa widoku…"></header><main>${cards}</main><script>document.getElementById('search').addEventListener('input',e=>document.querySelectorAll('article').forEach(a=>a.hidden=!a.dataset.title.includes(e.target.value.toLowerCase())))</script></html>`
  fs.writeFileSync(path.join(root, 'mockups/mbg-v3/index.html'), html)
  console.log(routes.length + ' actual preview thumbnails + static gallery generated')
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
