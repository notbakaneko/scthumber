FROM node:16-bullseye-slim

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
  python \
  yarnpkg

ADD . /app

WORKDIR /app

RUN yarnpkg --frozen-lockfile

CMD ["yarnpkg", "scthumbd"]
