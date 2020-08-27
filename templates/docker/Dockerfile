FROM nginx:1.18-alpine

# alpine 默认没有 bash  sh 运行脚本会有问题
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && apk add bash

COPY ./dist /usr/share/nginx/html

COPY ./entrypoint.sh /usr/share/nginx/html

COPY ./nginx.default.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
