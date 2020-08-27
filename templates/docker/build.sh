#!/bin/bash
set -ex
cd `dirname $0`

array_contains () {
    local array="$1[@]"
    local seeking=$2
    local in=1
    for element in "${!array}"; do
        if [[ $element == "$seeking" ]]; then
            in=0
            break
        fi
    done
    return $in
}

types=('replace' 'placeholder')

APP_NAME=`cat package.json |grep "\"name\"" |awk -F '"'  '{print $4}'`

VERSION=$1

# e.g. build.sh 1.0.0 placeholder
# placeholder 仅仅只是构建多环境镜像
# replace 在 placeholder 基础上会把网络资源替换成本地资源引用

TYPE=${2:-'placeholder'}

if !(array_contains types $TYPE) then
  echo -e "\033[31m the type must be replace or placeholder \033[0m"
  echo -e "\033[31m 类型必须是 replace 或者 placeholder \033[0m"
  exit 1
fi

echo "build project dist"

docker run --rm \
--network host \
-v $(pwd):/root/porject \
-w /root/porject \
node:12.16.3-alpine sh -c "
  yarn config set registry https://registry.npm.taobao.org/
  yarn --network-timeout 100000
  yarn build:${TYPE}"

echo "build project successful"

echo "build image now"

# set image name
IMAGE_NAME=`[ ! $VERSION ] && echo ${APP_NAME} || echo ${APP_NAME}:${VERSION}`

docker build -t ${IMAGE_NAME} .

echo "build image successful"
