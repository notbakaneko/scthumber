FROM node:16-bullseye-slim

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
  python \
  yarnpkg

ADD --chown=node:node . /app

WORKDIR /app
USER node
ENV NODE_ENV=production

RUN yarnpkg --frozen-lockfile

CMD ["yarnpkg", "scthumbd"]
