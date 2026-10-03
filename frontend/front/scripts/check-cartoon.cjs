const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict')
const { chromium } = require(
  path.join(
    process.env.MBG_RUNTIME_MODULES ||
      'C:/Users/micha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',
    'playwright',
  ),
)
const url = process.env.MBG_PREVIEW_URL || 'http://127.0.0.1:5175'
async function main() {
  const browser = await chromium.launch({ headless: true }),
    checks = [],
    errors = [],
    external = []
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('request', (r) => {
      if (r.resourceType() === 'image' && !r.url().startsWith(url)) external.push(r.url())
    })
    await page.goto(url)
    await page.locator('.cartoon-hero').waitFor()
    await page.waitForTimeout(2400)
    assert.equal(
      await page.locator('.cartoon-hero-copy').evaluate((e) => getComputedStyle(e).transform),
      'matrix(1, 0, 0, 1, 0, 0)',
    )
    assert.equal(
      await page.locator('.hero-stats strong > span[aria-hidden="true"]').first().innerText(),
      '3',
    )
    checks.push('React Bits entrance settles and counters reach fixture values')
    await page.getByRole('link', { name: 'Zgłoś problem', exact: true }).click()
    await page.getByRole('link', { name: /Marta · użytkownik/ }).click()
    await page.getByRole('heading', { name: 'Co warto zmienić w Twojej okolicy?' }).waitFor()
    checks.push('report intent survives demo account selection')
    await page.goto(url)
    await page.getByRole('link', { name: 'Poznaj innowacje', exact: true }).click()
    await page.getByRole('link', { name: /Marta · użytkownik/ }).click()
    assert(page.url().endsWith('/innowacje'))
    checks.push('catalogue intent survives demo account selection')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(url)
    await page.locator('.cartoon-hero').waitFor()
    assert.equal(
      await page.locator('.cartoon-hero-copy').evaluate((e) => getComputedStyle(e).opacity),
      '1',
    )
    assert.equal(
      await page.locator('.cartoon-hero-copy').evaluate((e) => getComputedStyle(e).transform),
      'none',
    )
    assert.equal(
      await page.locator('.hero-stats strong > span[aria-hidden="true"]').first().innerText(),
      '3',
    )
    checks.push('reduced motion retains visible hero and final numbers without transforms')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(url)
    await page.getByRole('button', { name: 'Menu strony głównej' }).click()
    assert(await page.getByRole('link', { name: 'Mapa potrzeb', exact: true }).isVisible())
    await page.getByRole('link', { name: 'Mapa potrzeb', exact: true }).click()
    await page.getByRole('link', { name: /Marta · użytkownik/ }).click()
    assert(page.url().endsWith('/potrzeby'))
    checks.push('mobile navigation preserves map destination')
    await page.goto(url + '/start')
    assert.equal(
      await page.locator('.app-layout').evaluate((e) => getComputedStyle(e).backgroundColor),
      'rgb(216, 234, 219)',
    )
    await page.goto(url + '/poparcie')
    await page.locator('img').first().waitFor()
    assert.equal(external.length, 0)
    assert.equal(errors.length, 0)
    checks.push('dashboard has distinct background; no external image requests or runtime errors')
    const report = { date: new Date().toISOString(), checks, errors, externalImages: external }
    fs.writeFileSync(
      path.resolve(__dirname, '../mockups/mbg-v4/verification.json'),
      JSON.stringify(report, null, 2),
    )
    console.log(JSON.stringify(report))
  } finally {
    await browser.close()
  }
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
