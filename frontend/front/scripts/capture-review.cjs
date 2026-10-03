const path = require('node:path'),
  fs = require('node:fs')
const { chromium } = require(
  path.join(
    process.env.MBG_RUNTIME_MODULES ||
      'C:/Users/micha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',
    'playwright',
  ),
)
const root = path.resolve(__dirname, '..'),
  out = path.join(root, '.impeccable/review')
fs.mkdirSync(out, { recursive: true })
const targets = {
  desktop: '/',
  mobile: '/',
  start: '/start',
  report: '/zgloszenia/nowe',
  results: '/zgloszenia/1/wyniki',
  catalogue: '/innowacje',
  map: '/potrzeby',
  idea: '/pomysly/nowy',
  support: '/poparcie',
  admin: '/admin',
  gates: '/admin/pilotaze/1',
  budget: '/admin/pilotaze/1/budzet',
  participants: '/admin/pilotaze/1/uczestnicy',
  brand: '/marka',
}
;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [name, route] of Object.entries(targets)) {
      if (process.argv[2] && process.argv[2] !== name) continue
      const mobile = ['mobile', 'report', 'map', 'support', 'participants'].includes(name)
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
        reducedMotion: 'reduce',
      })
      await page.goto((process.env.MBG_PREVIEW_URL || 'http://127.0.0.1:5175') + route)
      await page.locator('h1').waitFor()
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.race([
          Promise.all([...document.images].map((image) => image.decode().catch(() => {}))),
          new Promise((resolve) => setTimeout(resolve, 10000)),
        ])
      })
      if (
        await page
          .locator('img')
          .evaluateAll((images) => images.some((image) => !image.complete || !image.naturalWidth))
      ) {
        throw Error(`Incomplete image in ${name}; capture not valid`)
      }
      await page.screenshot({ path: path.join(out, name + '.png') })
      if (name === 'desktop' || name === 'mobile') {
        await page.screenshot({path:path.join(root,'mockups/mbg-v3/screenshots',`landing-${name}.png`),fullPage:true})
      }
      await page.close()
    }
    console.log(
      process.argv[2]
        ? `${process.argv[2]} review capture ready`
        : '14 viewport review captures ready',
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
