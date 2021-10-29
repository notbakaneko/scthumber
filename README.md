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
