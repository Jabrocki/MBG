const path = require('node:path')
const fs = require('node:fs')
const sharp = require(
  path.join(
    process.env.MBG_RUNTIME_MODULES ||
      'C:/Users/micha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',
    'sharp',
  ),
)
const root = path.resolve(__dirname, '..')
const source = path.join(root, 'mockups/mbg-v4/cartoon-source.png')
async function main() {
  const info = await sharp(source).metadata()
  await sharp(source)
    .resize({ width: 1800, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(path.join(root, 'public/images/małopolska-hero.webp'))
  const region = {
    left: Math.round(info.width * 0.42),
    top: Math.round(info.height * 0.18),
    width: Math.floor(info.width * 0.58),
    height: Math.floor(info.height * 0.82),
  }
  await sharp(source)
    .extract(region)
    .resize({ width: 1000 })
    .webp({ quality: 88 })
    .toFile(path.join(root, 'public/images/community.webp'))
  await sharp(path.join(root, 'public/brand/mbg-landscape-original.png'))
    .trim()
    .resize({ width: 920 })
    .webp({ lossless: true })
    .toFile(path.join(root, 'public/brand/mbg-landscape.webp'))
  fs.writeFileSync(
    path.join(root, 'public/brand/mbg-landscape.webp.json'),
    JSON.stringify(
      {
        prompt:
          'Origin: user-supplied Małopolska bez granic – logo krajobrazowe.png. Unchanged artwork; transparent margins trimmed and resized for web. Original retained as mbg-landscape-original.png.',
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  )
  console.log('Cartoon hero, community illustration and supplied logo optimized')
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
