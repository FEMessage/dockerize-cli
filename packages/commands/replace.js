const path = require('path')
const ora = require('ora')
const consola = require('consola')
const fs = require('fs')

const {
  downloadFiles,
  getCDNLinks,
  downloadElementsFont,
  getCustomConfig,
  getAssetPath,
  replaceUrl,
} = require('../../utils')

const {defaultConifg} = require('../../utils/config')

module.exports = async function (distDir, publicPath) {
  const customConfig = getCustomConfig()

  const config = {
    ...defaultConifg,
    ...customConfig,
  }

  // the two attrs level is default > customFileConfig > inline
  if (distDir) config.distDir = distDir
  if (publicPath) config.publicPath = publicPath

  config.distDir = path.join(process.cwd(), `./${config.distDir}`)

  config.localAssetsDir = path.join(`${config.distDir}`, config.assetsDir)

  config.filesPattern = path.join(config.distDir, './**/*.@(js|html|css)')

  /* ==========  get all network url of the dist dir ============== */
  const spinner = ora(
    `reading the distDir ${config.distDir}, please wait a moment\n`
  ).start()

  config.links = getCDNLinks(config)
  config.linksSet = new Set(config.links.map(getAssetPath(config)))

  if (!config.links.length) {
    spinner.stop()
    return consola.error(
      'dockerize-cli: readed links is empty, please check your config.linkesFilter function or all the links replaced'
    )
  }

  spinner.succeed('read links success!!')
  spinner.stop()

  /* ==========  over ============== */

  // if the assets dir don't exist
  if (!fs.existsSync(config.localAssetsDir)) {
    fs.mkdirSync(config.localAssetsDir)
  }

  // download asstes files
  try {
    await downloadFiles(config)
    await downloadElementsFont(config)
  } catch (error) {
    consola.error(error)
  }

  // replace file content network url
  replaceUrl(config)
}
