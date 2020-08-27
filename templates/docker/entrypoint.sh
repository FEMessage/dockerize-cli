#!/bin/bash
# . $PWD/replace.sh $@

envs=$@

#UNAME=$(uname)

function getKey() {
  echo $1 | cut -d '=' -f '1'
}

function getValue() {
  echo $1 | cut -d '=' -f '2-'
}

function doReplacePlaceholder() {
  for i in ${envs[@]};
    do
      envKey=`getKey $i`
      envValue=`getValue $i`
      sed -i  "s#__PLACEHOLDER_$envKey#$envValue#g" $1
    done
}

function traverseFile() {
  echo $@
  for file in `ls $1`;
  do
    # 目录
    if [ -d "$1/$file" ]; then
      traverseFile "$1/$file" ${envs[@]}
    else
      ## https://www.cnblogs.com/xzlive/p/9485980.html
      ## 对.css|.js|.html文件执行替换操作
      # todo 优化定义一个数组
      if [ "${file##*.}"x = "css"x ] || [ "${file##*.}"x = "js"x ] || [ "${file##*.}"x = "html"x ];then
        # echo "$file"
        # 执行替换操作
        doReplacePlaceholder "$1/$file" ${envs[@]}
      fi
    fi
  done
}

traverseFile . ${envs[@]}

echo "启动nginx服务"
nginx -g "daemon off;"
