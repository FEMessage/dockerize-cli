# 前端项目快速镜像化

看到这里的你，想必已经执行过 npx @femessage/dockerize-cli init 了

你的项目里会多出以下这些文件

![init files](https://raw.githubusercontent.com/femessage/dockerize-cli/master/public/images/init.png)

## 文件介绍

- .dockerignore 执行 docker 指令，复制文件等操作的时候，会忽略里面符合描述的文件
- .env.placeholder 构建多环境执行镜像，需要占位符变量，所以这里需要把项目中的环境变量都按照格式传递
- build.sh 构建脚本
- DOCKER_BUILD-ZH.md 使用文档（中文）
- Dockerfile 执行 docker build 的行为定义文件
- entrypoint.sh 镜像的启动脚本, 执行的时候会把传入的变量替换为真实变量
- nginx.default.conf nginx 配置文件
- webpack.definePlugin.js 注入 .env.placeholder 相关变量的函数，需要自己传入到 webpack 的扩展中

## npm script 介绍

执行 init 后，不仅会帮你在项目中初始化必须文件，还会帮你一些 script 执行命令

```json
{
  "script": {
    "build:replace": "yarn build:placeholder && yarn replace",
    "build:placeholder": "yarn build:set-env && yarn build",
    "build:image": "sh ./build.sh",
    "build:set-env": "cross-env BUILD_TYPE=image PUBLIC_PATH=__PLACEHOLDER_PUBLIC_PATH API_SERVER=__PLACEHOLDER_API_SERVER",
    "replace": "npx dockerize-cli replace dist __PLACEHOLDER_PUBLIC_PATH"
  }
}
```

这里对命令介绍一下，顺序从基础到复杂（script 设计采用的是组合的方式）

- replace

单纯的执行把指定文件的网络资源替换为本地资源

- build:set-env

设置环境变量，因为 PUBLIC_PATH API_SERVER 会在 webpack 插件之前执行，所以需要在前面注入

- build:replace

执行构建，并且构建完成后进行 replace 替换

- build:placeholder

只进行普通的多环境镜像打包构建，不进行 replace 替换

- build:image [version][type]

执行构建项目，并且打包成镜像

version 指的是镜像版本号, 默认不填会使用 latest

type 指的是构建的类型，默认为 placeholder（只构建多环境镜像），也可以输入为 replace

## 使用

使用之前要先进行简单改造

### nuxt 项目配置方式

IS_IMAGE 变量在上面的 cross-env 配置过

然后如果是镜像部署的话，nuxt 项目是不能使用 publicPath 的，需要使用 router 的 base 去设置 publicPath 否则有些资源无法覆盖

```js
import {setPlaceHolderEnv} from './webpack.definePlugin'

const IS_IMAGE = process.env.BUILD_TYPE === 'image'

const publicPath = process.env.PUBLIC_PATH || '/_nuxt'

export default {
  router: {
    middleware: ['meta', 'auth'],
    mode: 'hash',
    [IS_IMAGE && 'base']: publicPath, // 添加了这一行，目的也是为了增加占位符
  },
  build: {
    [!IS_IMAGE && 'publicPath']: publicPath, // 如果是镜像部署，则不用传入的 public_path 否则会写入 2 次 placeholder
  },
  build: {
    extend(config) {
      ;[setPlaceHolderEnv].forEach(config)
    },
  },
}
```

### vue-cli

in your vue.config.js

```js
// init 的时候初始化的文件之一, 位置移动后，记得更新里面读取 .env 的路径
const {setEnvKey, setPlaceHolderEnv} = require('./webpack.definePlugin')

// 声明额外注入客户端的环境变量，请根据实际情况调整
// ps: 如果你的变量每个都是 VUE_APP 开头，符合 Vue 变量规范的化，可以不使用这个 Function
const extendProcessEnv = setEnvKey(['UPLOAD_ACTION', 'API_SERVER', 'APP_ID'])

// 代码示意，2 个 plugin 都需要添加到 webpack 的 chain
module.exports = {
  // 由于这里会在运行 plugin 之前就运行，所以需要写在启动命令中
  publicPath: process.env.PUBLIC_PATH || '/', // vue-cli 必须用 publicPath 注入

  chainWebpack(config) {
    const plugins = [extendProcessEnv, setPlaceHolderEnv]

    plugins.forEach((plugin) => plugin(config))
  },
}
```

### 修改需要动态修改 即 占位符 变量

在你的项目的根目录下的 .env.placeholder

根据你项目的实际需求去修改即可

格式为 `__PLACEHOLDER_${env_name}`

例如

```shell
UPLOAD_ACTION=__PLACEHOLDER_UPLOAD_ACTION
API_SERVER=__PLACEHOLDER_API_SERVER
APP_ID=__PLACEHOLDER_APP_ID
PUBLIC_PATH=__PLACEHOLDER_PUBLIC_PATH
```

启动镜像的时候我们会把这些变量真正的替换成你需要的真实环境变量

## 构建

```shell
yarn build:image
```

## 运行镜像

```shell
docker run -d  -p 8002:80 --name ${image_name} ${container_name} API_SERVER=http://api.deepexi.com APP_ID=1000 PUBLIC_PATH=
```
