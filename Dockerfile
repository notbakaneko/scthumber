FROM node:16-bullseye-slim

USER node

ADD --chown=node:node . /app

WORKDIR /app
ENV NODE_ENV=production

RUN yarn --frozen-lockfile --ignore-optional

CMD ["yarn", "scthumbd"]
