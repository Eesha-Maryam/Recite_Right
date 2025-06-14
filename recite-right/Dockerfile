FROM node:20-alpine-slim

RUN apk add --no-cache tini && \
  mkdir -p /usr/src/node-app && \
  chown -R node:node /usr/src/node-app

WORKDIR /usr/src/node-app

COPY package.json package-lock.json ./

USER node

RUN npm ci --production

COPY --chown=node:node . .

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
