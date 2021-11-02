FROM node:16-bullseye-slim

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
  python

ADD --chown=node:node . /app

WORKDIR /app
USER node
ENV NODE_ENV=production

RUN npm ci --no-optional

CMD ["npm", "run", "scthumbd"]
