FROM node:16.12.0-bullseye

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
  software-properties-common \
  build-essential \
  pkg-config \
  libcairo2-dev \
  libjpeg-dev \
  libpng-dev \
  libvips-dev \
  libgif-dev \
  nasm \
  yarnpkg

ADD . /app

WORKDIR /app

RUN yarnpkg --frozen-lockfile

CMD ["yarnpkg", "scthumbd"]
