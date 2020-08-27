const path = require('path')
const stream = require('stream')
const fs = require('fs')
const {promisify} = require('util')
const glob = require('glob')
const consola = require('consola')
const got = require('got')
const gulp = require('vinyl-fs')
const replace = require('gulp-replace')
const allSettled = require('promise.allsettled')
const isString = require('lodash.isstring')
const deepClone = require('lodash.clonedeep')

const pipeline = promisify(stream.pipeline)

const REJECTED = 'rejected'

function downloadFile({rejectUnauthorized, link, targetPath}) {
  return new Promise((resolve, reject) => {
    const isExist = fs.existsSync(targetPath)

    if (isExist) {
      consola.success(`${link} is existed`)
      return resolve(link)
    }

    pipeline(
      got.stream(link, {
        https: {rejectUnauthorized},
      }),
      fs.createWriteStream(targetPath)
    )
      .then(() => {
        consola.success(`${link} downloaded in ${targetPath}`)
        resolve(link)
      })
      .catch((error) => {
        consola.error(error)
        reject(link)
      })
  })
}

async function downloadFiles(config) {
  const {links} = config

  const promises = await allSettled(
    links
      .map((link) => ({
        link,
        targetPath: path.join(config.localAssetsDir, path.basename(link)),
        rejectUnauthorized: config.rejectUnauthorized,
      }))
      .map(downloadFile)
  )

  const rejectList = promises
    .filter(({status}) => status === REJECTED)
    .map(({reason}) => reason)

  if (rejectList.length) {
    consola.error(`failed fetch list \n`)
    consola.error(rejectList)
  }
}

// 兼容 windows 操作系统的编译路径
const proxyPath = new Proxy(path, {
  get(_, key) {
    return path.posix[key]
  },
})

// 获取cdn列表
function getCDNLinks(config) {
  const files = glob.sync(config.filesPattern)

  const links = files.reduce((acc, file) => {
    let fileContent = fs.readFileSync(file, 'utf-8')

    const linkList = [
      ...(fileContent.match(config.linksRegexp) || []),
    ].map((path) =>
      path.replace(/^\/\//, 'https://').replace(/^http:/, 'https:')
    )

    acc = acc.concat(linkList)
    return acc
  }, [])

  return config.linkesFilter(links, config.defeaultIgnoreArray)
}

function downloadElementsFont(config) {
  const elePath = config.links.find((v) => /@femessage?\/element-ui/.test(v))

  if (!elePath) return

  const baseHost = path.dirname(elePath)
  const fonts = ['fonts/element-icons.woff', 'fonts/element-icons.ttf'].map(
    (file) => ({
      link: `${baseHost}/${file}`,
      targetPath: path.join(config.localAssetsDir, path.basename(file)),
      rejectUnauthorized: config.rejectUnauthorized,
    })
  )

  return Promise.all(fonts.map(downloadFile))
}

const CONFIG_FILE_NAME = 'dockerize.config.js'

function getCustomConfig() {
  const customConfigPath = path.join(process.cwd(), CONFIG_FILE_NAME)

  if (fs.existsSync(customConfigPath)) {
    const configData = require(customConfigPath)

    return configData
  }

  return {}
}

const getAssetPath = (config) => (path) =>
  proxyPath.join(config.publicPath, config.assetsDir, proxyPath.basename(path))

const replaceUrl = (config) => {
  const _getAssetPath = getAssetPath(config)

  gulp
    .src(config.filesPattern)
    .pipe(
      replace(config.linksRegexp, function (match) {
        const filePath = _getAssetPath(match)

        if (config.linksSet.has(filePath)) {
          return filePath
        }

        return match
      })
    )
    .pipe(
      // element icon solution
      replace(/fonts\/element-icons\.(woff|ttf)/g, function (match) {
        return _getAssetPath(match)
      })
    )
    .pipe(gulp.dest(config.distDir))

  console.log('\n')
  consola.success('replace successful !!!!!!!!')
}

function transformProxyConfig(proxyConfig) {
  const cloneConfig = deepClone(proxyConfig)

  Object.keys(cloneConfig).forEach((key) => {
    if (isString(cloneConfig[key])) {
      cloneConfig[key] = {
        target: cloneConfig[key],
        changeOrigin: true,
      }
    }
  })

  return cloneConfig
}

exports.downloadElementsFont = downloadElementsFont
exports.getCDNLinks = getCDNLinks
exports.proxyPath = proxyPath
exports.downloadFiles = downloadFiles
exports.getCustomConfig = getCustomConfig
exports.getAssetPath = getAssetPath
exports.replaceUrl = replaceUrl
exports.transformProxyConfig = transformProxyConfig
exports.CONFIG_FILE_NAME = CONFIG_FILE_NAME
