/* eslint-disable */

/*
 * @Description Auto inject .env to  client
 */
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

const findDefinePlugin = (config) => {
  return config.plugins.find((plugin) => {
    return plugin.constructor.name === 'DefinePlugin'
  })
}

/**
 *
 * @param {*} config vue-cli/nuxt webpack config
 * @param {*} env object value that you set to the en
 */
function defineEnvs(config, env) {
  if (!config) {
    throw new Error('请传入 vue-cli/nuxt webpack config')
  }

  if (config.plugin) {
    config.plugin('define').tap((definitions) => {
      Object.keys(env).forEach((key) => {
        definitions[0]['process.env'][key] = JSON.stringify(env[key])
      })
      return definitions
    })
  } else {
    const definPlugin = findDefinePlugin(config)

    Object.keys(env).forEach((key) => {
      definPlugin.definitions[`process.env.${key}`] = JSON.stringify(env[key])
    })
  }
}

function setEnvKey(EnvKeys = []) {
  const env = EnvKeys.reduce((obj, key) => {
    if (process.env[key]) {
      obj[key] = process.env[key]
    }
    return obj
  }, {})

  return (config) => defineEnvs(config, env)
}

/**
 * 对变量设置设置占位符
 * @param {*} config webpack config 对象
 * @param {string} rootDir placeholder 所在的文件目录
 * 读取项目中的 .env.placeholder 的变量注入项目
 */
function setPlaceHolderEnv(config, rootDir = process.cwd()) {
  const {BUILD_TYPE, NODE_ENV} = process.env

  if (NODE_ENV === 'production' && BUILD_TYPE === 'image') {
    const envPath = path.resolve(rootDir, '.env.placeholder')

    if (!fs.existsSync(envPath)) {
      throw new Error('placeholder env 地址不存在，请检查文件地址 : ', envPath)
    }

    const env = dotenv.parse(fs.readFileSync(envPath, 'utf-8'))

    config && defineEnvs(config, env)
  }
}

module.exports = {
  setEnvKey,
  setPlaceHolderEnv,
}
