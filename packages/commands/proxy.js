const path = require('path')
const Koa = require('koa')
const static = require('koa-static')
const consola = require('consola')
const proxy = require('koa-server-http-proxy')
const openBrowsers = require('open-browsers')
const {
  getCustomConfig,
  transformProxyConfig,
  CONFIG_FILE_NAME,
} = require('../../utils')
const defaultConfig = require('../../utils/config')

const PROXY_KEY = 'proxy'

module.exports = async function () {
  const config = {
    ...defaultConfig,
    ...getCustomConfig(),
  }

  const {proxyPort} = config

  if (!config[PROXY_KEY]) {
    return consola.error(
      `use the proxy function you need a has ${CONFIG_FILE_NAME} file in your project root and with proxy attrs in your module.exports object`
    )
  }

  if (typeof config[PROXY_KEY] !== 'object') {
    return consola.error('proxy must be a object')
  }

  const proxyConfig = transformProxyConfig(config[PROXY_KEY])

  console.log(proxyConfig)

  const staticPath = path.join(process.cwd(), './', config.staticPath)

  const app = new Koa()

  app.use(static(staticPath))

  Object.keys(proxyConfig).forEach((apiPrefix) => {
    const options = proxyConfig[apiPrefix]
    app.use(proxy(apiPrefix, options))
  })

  app.listen(proxyPort, () => {
    const url = `http://localhost:${proxyPort}`
    consola.success(`server listen at ${url} \n`)
    openBrowsers(url)
  })
}
