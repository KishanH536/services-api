FROM node:jod-alpine

RUN apk update && apk upgrade

RUN apk add --no-cache bash gnupg tzdata make

RUN \
  apk add --no-cache openssh-client git \
  && adduser -D app

USER app

WORKDIR /home/app
COPY package.json package-lock.json ./
COPY scripts scripts

ARG GH_PIPELINE_TOKEN

RUN \
  echo "@msi-calipsa:registry=https://npm.pkg.github.com/" >> .npmrc && \
  echo "//npm.pkg.github.com/:_authToken=$GH_PIPELINE_TOKEN" >> .npmrc && \
  chmod 644 .npmrc

RUN \
  npm ci --omit=dev \
  && npm cache clean --force \
  && rm .npmrc

COPY config config
COPY src src
COPY openapi openapi

USER root
RUN \
  apk del openssh-client git \
  && rm -r scripts

USER app

EXPOSE 8080
ENTRYPOINT ["node", "src/index.js"]
