const path = require('path')
const fs = require('fs')
const consola = require('consola')
const package = require('../../package.json')

const PUBLIC_PATH = '__PLACEHOLDER_PUBLIC_PATH'
const API_SERVER = '__PLACEHOLDER_API_SERVER'

const getRunScript = () => {
  // 这里为了兼容 nuxt 跟 vue-cli 有些变量是在 webpack config 执行之前就已经使用了，目前只发现这2个，如果项目中不一样可以自行改动。
  const scripts = {
    'build:replace': 'yarn build:placeholder && yarn replace',
    'build:placeholder': 'yarn build:set-env && yarn build',
    'build:image': 'sh ./build.sh',
    'build:set-env': `cross-env BUILD_TYPE=image PUBLIC_PATH=${PUBLIC_PATH} API_SERVER=${API_SERVER}`,
    replace: `npx dockerize-cli replace dist ${PUBLIC_PATH}`,
  }

  const devDependencies = {
    '@femessage/dockerize-cli': `^${package.version}`,
    'cross-env': 'latest',
  }
  return {
    scripts,
    devDependencies,
  }
}

module.exports = async () => {
  const projectPath = path.join(process.cwd(), `./`)

  const DIR = path.join(__dirname, '../../templates/docker')
  const pkg_path = path.join(projectPath, 'package.json')

  let files = fs.readdirSync(DIR)

  if (!fs.existsSync(pkg_path)) {
    consola.error('请在项目根目录运行此命令')
    return
  }

  const pkg = require(pkg_path)

  Object.entries(getRunScript()).forEach(([key, value]) => {
    pkg[key] = Object.assign(pkg[key], value)
  })

  fs.writeFileSync(pkg_path, JSON.stringify(pkg, {}, 2), {
    flag: 'w+',
  })

  const errors = []

  files.forEach((file) => {
    const targetPath = path.join(projectPath, file)

    if (fs.existsSync(targetPath)) {
      consola.error(file, ' is existed')
      errors.push(file)
    } else {
      fs.createReadStream(path.join(DIR, file)).pipe(
        fs.createWriteStream(targetPath)
      )
    }
  })

  if (errors.length) {
    consola.error('some of files init failed ! \n\n', errors)
  } else {
    consola.success('init successful !!!!!')
  }
}
