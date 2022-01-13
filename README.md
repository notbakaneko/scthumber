# scthumber

A node.js image thumbnailing daemon utilizing [Smartcrop.js](https://github.com/jwagner/smartcrop.js/) for content-aware cropping with [vips](http://www.vips.ecs.soton.ac.uk/) (via [sharp](https://github.com/lovell/sharp)) for resizing+processing.

Originally forked from [connect-thumbs](https://github.com/inadarei/connect-thumbs) but has since gone in a different direction.

(This is one of those ugly proof-of-concepts that ended up in production somehow.)

### Installing Dependencies

scthumber is dependent on:
smartcrop.js
sharp

On a Debian/Ubuntu system:

    yarn --frozen-lockfile --ignore-optional


## Configuration
See `const thumber` in `scthumbd.js` for now...

## Running

    yarn scthumbd


## Envrionment variables

Variable          | Description
----------------- | ------------
DD_AGENT_HOST     | statsd host; defaults to `undefined` which sends to `127.0.0.1`
DD_DOGSTATSD_PORT | statsd port; defaults to `8125`
PORT              | listening port, defaults to 4001.
WORKERS           | number of worker processes to spawn, defaults to number of cpus


## Docker

The entire Docker section assumes:
- Docker Compose V2 is used - replace `docker compose` with `docker-compose` if using Docker Compose V1.
- using Docker Desktop - there may be differences in the base host image and how container networking is exposed with non-Desktop Docker or other container runtimes.

To just build an image:

    docker build -t <repository_name>:<tag> .


### Development

The Docker Compose configuration is provided for development convenience. Usage for production or combination with other projects is outside the scope of the provided configuration. Builds for deployment _should not_ be using the provided Docker Compose configuration.

Running for development:

    docker compose up

will mount the local directory to the container; code changes will be reflected when the container is restarted.
The container will accept requests on port 4001. To use a different port, provide a `HTTP_PORT` env, e.g.:

    HTTP_PORT=8001 docker compose up


### Overriding settings

To override settings inside the container such as the number of workers or listening port, it is recommended to create use the `docker-compose.override.yml` file with the extra settings. Docker will automatically apply and merge settings from the override file when running `docker compose`.

Local development environment settings should be placed in the override file.

To connect to an existing container network, specify in `docker-compose.override.yml`, e.g.:

    networks:
      default:
        external: true
        name: osu-web


### node_modules

The `node_modules` used are not platform binary compatible - `node_modules` in the container will be mounted to a volume to limit it to the container by default.

While working in the container, dependencies should be updated via `docker compose run`

    docker compose run --rm http yarn --ignore-optional

If you want to use the local `node_modules`, you can override the existing volume mount:

    ./node_modules:/app/node_modules


## Common issues

### Cannot start sharp
    Something went wrong installing the "sharp" module

    Cannot find module '../build/Release/sharp-linux-x64.node'
    Require stack:
    - /app/node_modules/sharp/lib/sharp.js

`sharp` downloads and uses pre-built binaries by default; these builds are not compatible between platform architectures. Reinstall the packages. When using Docker, it is recommended to have a `node_modules` volume local to the container.


### Cannot connect to custom domain

This assumes the default Docker Desktop bridge networking is used and the remote host is accessible through the bridge network; different networking modes and container runtimes may require different configuration.

`scthumber` needs to be able to download the image source for thumbnailing.
When using a custom internal domain, you may need to add a mapping to the container to resolve.

e.g. If `osu-web.test` resolves to `127.0.0.1` on the host, it will also resolve to `127.0.0.1` in the container

Getting the host IP address on the container's network:

    docker compose run --rm http /bin/sh -c 'echo "$(getent hosts host.docker.internal)"' | awk '{ print $1 }'


If using `docker compose`, configure `extra_hosts` in a `docker-compose.override.yml` file with the format `<hostname>:<ip>`.

If using `docker run`, use the `--add-host` flag:

    docker run --add-host=<hostname>:<ip> --rm scthumber


### Missing Python when installing node packages

    gyp ERR! find Python You need to install the latest version of Python.

The Docker image does not include Python, use the `--ignore-optional` flag to to skip the optional dependencies.
Alternatively, the error can be ignored.
