const path = require('node:path'),
  fs = require('node:fs'),
  assert = require('node:assert/strict')
const { chromium } = require(
  path.join(
    process.env.MBG_RUNTIME_MODULES ||
      'C:/Users/micha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',
    'playwright',
  ),
)
const root = path.resolve(__dirname, '..'),
  url = process.env.MBG_PREVIEW_URL || 'http://127.0.0.1:5175'
;(async () => {
  const browser = await chromium.launch({ headless: true }),
    checks = []
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url + '/pomysly/nowy')
    await page.getByLabel('Nazwa pomysłu').fill('Szkic prywatny NIE PUBLIKOWAĆ')
    await page
      .getByLabel('Proponowane rozwiązanie')
      .fill('Treść wyłącznie prywatna, niezatwierdzona.')
    await page.getByRole('button', { name: 'Przygotuj szkic do sprawdzenia' }).click()
    await page.goto(url + '/pomysly/1?stan=oferta')
    assert.equal(await page.locator('h1').innerText(), 'Sąsiedzki stół')
    assert.equal(
      await page.getByText('Treść wyłącznie prywatna, niezatwierdzona.', { exact: true }).count(),
      0,
    )
    checks.push('private draft excluded from public fixture')
    await page.goto(url + '/adaptacje/nowa?innowacja=bawita')
    await page.getByLabel('Organizacja / placówka').fill('Instytucja testowa demo')
    await page.getByLabel('Miejscowość', { exact: true }).selectOption('Kraków')
    await page.getByLabel('Dostępny budżet').fill('1234')
    await page.getByLabel('Zasoby', { exact: true }).fill('Testowa sala i cztery godziny')
    await page.getByLabel('Ograniczenia', { exact: true }).fill('Testowe ograniczenie')
    await page.getByRole('button', { name: 'Przygotuj roboczą adaptację' }).click()
    await page.getByText('Instytucja testowa demo', { exact: true }).waitFor()
    await page.getByText('Kraków', { exact: true }).waitFor()
    await page.getByText('Testowa sala i cztery godziny', { exact: true }).waitFor()
    await page.getByText('Testowe ograniczenie', { exact: true }).waitFor()
    assert.match(await page.locator('main').innerText(), /1\s?234 zł/)
    checks.push('adaptation preserves edited inputs')
    await page.goto(url + '/potrzeby')
    await page.getByLabel('Promień odkrywania').selectOption('5')
    assert.equal(await page.locator('.map-marker').count(), 2)
    assert.equal(await page.locator('.need-item').count(), 2)
    checks.push('map and list use same radius filter')
    await page.goto(url + '/zgloszenia/nowe')
    await page.getByLabel('Opis potrzeby').fill('Krótki opis')
    await page.getByRole('button', { name: 'Dalej: miejsce potrzeby' }).click()
    await page.locator('#report-error').waitFor()
    assert.equal(await page.getByLabel('Opis potrzeby').getAttribute('aria-invalid'), 'true')
    assert.equal(await page.evaluate(() => document.activeElement.id), 'report-error')
    await page.getByRole('button', { name: 'Popraw opis potrzeby' }).click()
    assert.equal(await page.evaluate(() => document.activeElement.id), 'report-description')
    checks.push('report error connected and focused')
    await page.goto(url + '/zgloszenia/nowe?stan=poza-regionem')
    await page.getByRole('button', { name: 'Przejdź do potwierdzenia' }).click()
    assert.equal(await page.locator('#report-place').getAttribute('aria-invalid'), 'true')
    checks.push('out of region prevents continuation')
    await page.goto(url + '/innowacje?stan=blad')
    assert.equal(
      await page.getByText('Dane formularza pozostają w tym widoku.', { exact: false }).count(),
      0,
    )
    checks.push('load error does not promise preserved form')
    await page.goto(url + '/admin/pilotaze/1/budzet')
    await page.getByLabel('Materiały i narzędzia').fill('-1')
    assert.equal(
      await page.getByRole('button', { name: 'Zatwierdź przygotowany budżet' }).isDisabled(),
      true,
    )
    await page.locator('#budget-error').waitFor()
    checks.push('negative budget row blocks approval')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(url + '/zgloszenia/nowe')
    const bounds = await page.locator('.prototype-tools').boundingBox(),
      banner = await page.locator('.demo-banner').boundingBox()
    assert(bounds.y >= banner.y && bounds.y + bounds.height <= banner.y + banner.height + 1)
    await page.evaluate(() => scrollTo(0, 500))
    assert((await page.locator('.prototype-tools').boundingBox()).y < 0)
    checks.push('preview tools remain in reserved header')
    await page.goto(url + '/start')
    await page.getByRole('button', { name: 'Otwórz menu' }).click()
    await page.getByRole('navigation', { name: 'Menu dodatkowe' }).waitFor()
    checks.push('mobile menu opens after routing extraction')
    const report = { date: new Date().toISOString(), checks }
    fs.writeFileSync(
      path.join(root, 'mockups/mbg-v3/review-fixes-verification.json'),
      JSON.stringify(report, null, 2),
    )
    console.log(JSON.stringify(report))
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
