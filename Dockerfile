FROM node:16-bullseye-slim

ADD --chown=node:node . /app

WORKDIR /app
USER node
ENV NODE_ENV=production

RUN yarn --frozen-lockfile --ignore-optional

CMD ["yarn", "scthumbd"]
