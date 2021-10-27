FROM node:16.12.0-bullseye

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
  yarnpkg

ADD . /app

WORKDIR /app

RUN yarnpkg --frozen-lockfile

CMD ["yarnpkg", "scthumbd"]
