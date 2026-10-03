/* Run against the local Vite server. Uses an installed Playwright or the desktop bundled runtime. */
const fs = require('node:fs')
const path = require('node:path')
const bundle =
  'C:/Users/micha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
let playwright
try {
  playwright = require('playwright')
} catch {
  playwright = require(path.join(process.env.MBG_RUNTIME_MODULES || bundle, 'playwright'))
}
const { chromium } = playwright
const root = path.resolve(__dirname, '..')
const routes = [
  ...fs
    .readFileSync(path.join(root, 'src/routes.ts'), 'utf8')
    .matchAll(/\{\s*path: '([^']+)',\s+title: '([^']+)'/g),
].map((m) => ({ route: m[1], title: m[2] }))
const output = path.join(root, 'mockups/mbg-v3/screenshots')
fs.mkdirSync(output, { recursive: true })
const url = process.env.MBG_PREVIEW_URL || 'http://127.0.0.1:5175'
const slug = (route) =>
  route === '/' ? 'landing' : route.split('?')[0].slice(1).replaceAll('/', '-')
;(async () => {
  const browser = await chromium.launch({ headless: true })
  const errors = [],
    results = []
  try {
    for (const [device, viewport] of [
      ['desktop', { width: 1440, height: 1000 }],
      ['mobile', { width: 390, height: 844 }],
    ]) {
      const context = await browser.newContext({
        viewport,
        reducedMotion: 'reduce',
        deviceScaleFactor: 1,
      })
      const page = await context.newPage()
      page.on('pageerror', (e) => errors.push({ device, route: page.url(), error: e.message }))
      for (const screen of routes) {
        await page.goto(url + screen.route, { waitUntil: 'domcontentloaded' })
        await page.locator('h1').waitFor()
        await page.evaluate(async () => {
          await document.fonts.ready
          await Promise.race([
            Promise.all(
              [...document.images].map((i) =>
                i.complete
                  ? Promise.resolve()
                  : new Promise((r) => {
                      i.onload = r
                      i.onerror = r
                    }),
              ),
            ),
            new Promise((r) => setTimeout(r, 10000)),
          ])
        })
        const info = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          h1: document.querySelector('h1').textContent,
          brokenImages: [...document.images]
            .filter((i) => !i.complete || !i.naturalWidth)
            .map((i) => i.src),
          buttonsWithGradient: [...document.querySelectorAll('button,.button')].filter((e) =>
            getComputedStyle(e).backgroundImage.includes('gradient'),
          ).length,
          fonts: document.fonts.check('600 32px "Bricolage Grotesque Variable"'),
        }))
        await page.screenshot({
          path: path.join(output, `${slug(screen.route)}-${device}.png`),
          fullPage: true,
        })
        results.push({ ...screen, device, ...info })
        if (info.scrollWidth > info.width || info.brokenImages.length || info.buttonsWithGradient)
          console.log('CHECK', JSON.stringify(results.at(-1)))
      }
      console.log(`${device}: ${routes.length} screens captured`)
      await context.close()
    }
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url + '/zgloszenia/nowe')
    await page.getByRole('button', { name: 'Dalej: miejsce potrzeby' }).click()
    await page.getByRole('button', { name: 'Przejdź do potwierdzenia' }).click()
    await page.getByRole('button', { name: 'Potwierdzam tę potrzebę' }).click()
    await page.getByRole('heading', { name: 'Jedno rozwiązanie warte sprawdzenia.' }).waitFor()
    await page.getByRole('button', { name: 'Przestrzeń 3D' }).click()
    await page.locator('.semantic-plane').waitFor()
    await page.goto(url + '/innowacje')
    await page.getByRole('textbox', { name: 'Szukaj w bibliotece' }).fill('BaWita')
    if ((await page.locator('.innovation-row').count()) !== 1)
      throw Error('Catalogue filtering failed')
    await page.goto(url + '/pomysly/nowy?stan=ai-offline')
    await page.getByRole('button', { name: 'Zapisz do kolejki AI' }).click()
    await page.getByText('Prywatny · oczekuje na AI').waitFor()
    await page.goto(url + '/poparcie')
    await page.getByRole('button', { name: 'Popieram', exact: true }).click()
    await page.getByRole('button', { name: 'Cofnij ostatni wybór' }).click()
    await page.getByRole('heading', { name: 'Sąsiedzki stół', exact: true }).waitFor()
    await page.goto(url + '/pilotaze/1/udzial?stan=oferta')
    await page.getByRole('button', { name: 'Przyjmuję miejsce' }).click()
    await page.getByText('Udział potwierdzony w demo.').waitFor()
    await page.goto(url + '/admin/pilotaze/1?stan=blokada')
    if (!(await page.getByRole('button', { name: 'Zatwierdź start pilotażu' }).isDisabled()))
      throw Error('Pilot start gate failed')
    for (const box of await page.locator('.checklist input').all()) await box.check()
    await page.getByRole('button', { name: 'Zatwierdź start pilotażu' }).click()
    await page.goto(url + '/admin/pomysly/1?stan=kolejka')
    await page.getByRole('textbox', { name: 'Uzasadnienie' }).fill('Przykład')
    if (!(await page.getByRole('button', { name: 'Zatwierdź do poparcia w demo' }).isDisabled()))
      throw Error('AI publication gate failed')
    const states = [
      '/zgloszenia/nowe?stan=poza-regionem',
      '/zgloszenia/1/potwierdzenie?stan=pilne',
      '/zgloszenia/1/wyniki?stan=pusto',
      '/zgloszenia/1/wyniki?stan=brak-webgl',
      '/pomysly/nowy?stan=ai-offline',
      '/pomysly/1?stan=kolejka',
      '/pilotaze/1/udzial?stan=kolejka',
      '/pilotaze/1/udzial?stan=oferta',
      '/admin/pilotaze/1?stan=blokada',
      '/innowacje?stan=blad',
      '/potrzeby?stan=ladowanie',
    ]
    for (const route of states) {
      await page.goto(url + route)
      await page.locator('h1').waitFor()
      await page.screenshot({
        path: path.join(
          output,
          slug(route) + '-state-' + new URL(url + route).searchParams.get('stan') + '.png',
        ),
        fullPage: true,
      })
    }
    const report = {
      date: new Date().toISOString(),
      url,
      screens: routes.length,
      captures: results.length,
      testedInteractions: [
        'report-confirm-result',
        'semantic-view',
        'catalogue-filter',
        'AI-queue-gate',
        'support-undo',
        'offer-acceptance',
        'pilot-start-gate',
        'admin-publication-gate',
      ],
      errors,
      results,
    }
    fs.writeFileSync(
      path.join(root, 'mockups/mbg-v3/verification.json'),
      JSON.stringify(report, null, 2),
    )
    console.log(
      JSON.stringify({
        screens: routes.length,
        captures: results.length,
        errors,
        overflow: results.filter((r) => r.scrollWidth > r.width).length,
        broken: results.filter((r) => r.brokenImages.length).length,
      }),
    )
    if (
      errors.length ||
      results.some((r) => r.scrollWidth > r.width || r.brokenImages.length || r.buttonsWithGradient)
    )
      process.exitCode = 1
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
