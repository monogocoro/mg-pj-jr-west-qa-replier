FROM node:6.14.4-onbuild
MAINTAINER Ryohei Tanaka <tanaka@monogocoro.co.jp>

WORKDIR /usr/src/app/server/

HEALTHCHECK CMD [ "sh","/usr/src/app/healthcheck.sh"]

CMD [ "node", "client.js" ]
