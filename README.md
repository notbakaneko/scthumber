# scthumber

A node.js image thumbnailing daemon utilizing [Smartcrop.js](https://github.com/jwagner/smartcrop.js/) for content-aware cropping with [vips](http://www.vips.ecs.soton.ac.uk/) (via [sharp](https://github.com/lovell/sharp)) for resizing+processing.

Originally forked from [connect-thumbs](https://github.com/inadarei/connect-thumbs) but has since gone in a different direction.

(This is one of those ugly proof-of-concepts that ended up in production somehow.)

### Installing Dependencies

scthumber is dependent on:
smartcrop.js
sharp

On a Debian/Ubuntu system:
```
npm install # or yarn --frozen-lockfile
```

## Configuration
See `const thumber` in `scthumbd.js` for now...

## Running
```
npm run scthumbd
```


## Envrionment variables

`PORT` - listening port, defaults to 4001.

`WORKERS` - number of worker processes to spawn, defaults to number of cpus detected.


## Docker

This assumes Docker Compose V2 is used - replace `docker compose` with `docker-compose` if using Docker Compose V1.

Running for development:
```
docker compose up
```
will mount the local directory to the container; code changes will be reflected when the contianer is restarted.
The container will accept requests on port 4001. To use a different port, provide a `HTTP_PORT` env, e.g.:

```
HTTP_PORT=8001 docker compose up
```

To override settings inside the container such as the number of worker or listening port, it is recommended to create another docker-compose file with the extra settings and use that file when running `docker compose`, e.g.:

```
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```


To just build an image
```
docker build -t <repository_name>:<tag> .
```

### Networking Notes

This assumes the default Docker bridge networking is used; different networking modes and container runtimes may require different configuration.

scthumber needs to be able to download the image source for thumbnailing.
If using a custom internal domain that doesn't resolve to a public IP address for the image origin, you will need to add a mapping to the container to resolve.

Get host IP address:
```
docker run --rm scthumber /bin/sh -c 'echo "$(getent hosts host.docker.internal)"' | awk '{ print $1 }'
```

If using `docker compose`, uncomment `extra_hosts` section in `docker-compose.override.yml` and replace with with the format `<hostname>:<ip>`, or create a new `docker-compose` settings file (recommended).

If using `docker run`, use the `--add-host` flag:
```
docker run --add-host=<hostname>:<ip> --rm scthumber
```

Note that `localhost` in image urls will resolve to the container's `127.0.0.1`, not the host's.
