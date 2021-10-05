if (!module.parent) { console.log("this is a module and should not be run directly."); process.exit(1); }

let presets;
let allowedExtensions;

const defaultPresets = {
  small: {
    width: 120,
    quality: 50,
  },
  medium: {
    width: 300,
    quality: 70,
  },
  large: {
    width: 900,
    quality: 90,
  }
};

const
  http         = require('http'),
  moment       = require('moment'),
  mozjpeg      = require('mozjpeg-stream'),
  server_stats = require('./scthumber-stats'),
  sharp        = require('sharp');

/**
 * Merge user-provided options with the sensible defaults.
 * @param options
 */
function parseOptions(options) {
  presets = options.presets ?? defaultPresets;

  allowedExtensions = options.allowedExtensions ?? ['gif', 'png', 'jpg', 'jpeg'];
  for (var i=0; i < allowedExtensions.length; i++) {
    // be forgiving to user errors!
    if (allowedExtensions[i][0] === '.') {
      allowedExtensions[i] = allowedExtensions[i].substring(1);
    }
  }
}

function log(...messages) {
  timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  console.log(`[${'%s'.grey}] ${'%s'.white}`, timestamp, messages.join(' '));
}

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(`Error retrieving image: UPSTREAM ${response.statusCode}`);
      }
      var data = [];
      response.on('data', (chunk) => data.push(chunk));
      response.on('end', () => resolve(Buffer.concat(data)));
    });
  });
}

function resizeImage(inputBuffer, preset) {
  return new Promise((resolve, reject) => {
    const { createCanvas, Image } = require('canvas');
    const SmartCrop = require('smartcrop');

    if (!preset.width) {
      reject('preset width not set');
    }

    if (!preset.quality) {
      preset.quality = 94;
    }

    if (!preset.height) {
      preset.height = preset.width;
    }

    var pixelScale = preset.pixelScale ?? 1;
    var canvasOptions = {
      'canvasFactory': function(w, h) { return createCanvas(w, h); },
      'width': preset.width * 2,
      'height': preset.height * 2,
    };

    var img = new Image();
    img.src = inputBuffer;

    // TODO: handle crop promise rejection
    SmartCrop.crop(img, canvasOptions)
      .then((result) => {
        var rect = result.topCrop;
        sharp(inputBuffer)
          .extract({
            'left': rect.x,
            'top': rect.y,
            'width': rect.width,
            'height': rect.height
          })
          .resize(preset.width * pixelScale, preset.height * pixelScale)
          .sharpen()
          .jpeg({'quality': 100})
          .toBuffer()
          .then((output) => {
            resolve(output);
          });
      });
  });
}

function imageOptim(inputBuffer) {
  return sharp(inputBuffer)
    .jpeg({'quality': 100})
    .pipe(
      mozjpeg({'quality': 94, 'args': '-baseline'})
    );
}

exports = module.exports = function (opts) {
  const stats = server_stats();

  function errorAbort(res, message, failStat, statusCode) {
    stats.increment(failStat);
    res.writeHead(statusCode ?? 400);
    res.end(message ?? 'invalid arguments');
  }

  function handleFetchError(err, req, res) {
    log(`ERR: ${req.originalUrl} [${err}]`.red);
    errorAbort(res, `Error retrieving image: ${err}`, 'upstream_error', 502);
  }

  function invalidArgsAbort(res, message) {
    errorAbort(res, message ?? 'invalid arguments', 'arg_error');
  }

  function logOk(req, data, startTime) {
    const elapsed = Date.now() - startTime;
    log(`OK: ${req.originalUrl} (src: ${Math.round(data.length/1024)}KB) [${elapsed}ms]`.green);
    stats.increment('ok');
    stats.addElapsedTime(elapsed);
  }

  function thumbnail(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { return invalidArgsAbort(res); }

    // Is this a request to a thumbnail image?
    regexp = new RegExp('^\/thumb\/([A-Za-z0-9_@]+)\/([%\.\-A-Za-z0-9_@=\+]+\.(?:' + allowedExtensions.join('|') + '))(\\?[0-9]+)?$', 'i');
    var thumbRequestParts = req.originalUrl.match(regexp);
    if (!thumbRequestParts) {
      return invalidArgsAbort(res);
    }

    var imagePreset = thumbRequestParts[1];
    if (!presets[imagePreset]) {
      // invalid preset?
      return invalidArgsAbort(res);
    }

    var upstreamURL = "http://" + thumbRequestParts[2];
    if (thumbRequestParts[3] != undefined)
      upstreamURL += thumbRequestParts[3];

    var request_start = Date.now();
    log(`Thumbnailing ${req.originalUrl}...`);
    fetchURL(upstreamURL)
      .then((data) => {
        resizeImage(data, presets[imagePreset])
          .catch((err) => {
            log(`ERR: ${req.originalUrl} [${err}]`.red);
            return errorAbort(res, `Error resizing image: ${err}`, 'thumb_error', 500);
          })
          .then((image) => {
            imageOptim(image)
              .pipe(res)
              .on('finish', () => logOk(req, data, request_start));
          });
      })
      .catch((err) => handleFetchError(err, req, res));
  }

  function optimize(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { return invalidArgsAbort(res); }

    regexp = new RegExp('^\/optim\/([%\.\-A-Za-z0-9_@=\+]+\.(?:' + allowedExtensions.join('|') + '))(\\?[0-9]+)?$', 'i');
    var thumbRequestParts = req.originalUrl.match(regexp);
    if (!thumbRequestParts) {
      return invalidArgsAbort(res);
    }

    var upstreamURL = "http://" + thumbRequestParts[1];
    if (thumbRequestParts[2] != undefined)
      upstreamURL += thumbRequestParts[2];

    var request_start = Date.now();
    log(`Optimizing ${req.originalUrl}...`);
    fetchURL(upstreamURL)
      .then((data) => {
        imageOptim(data)
          .pipe(res)
          .on('finish', () => logOk(req, data, request_start));
      })
      .catch((err) => handleFetchError(err, req, res));
  }

  function get_stats(req, res) {
    stats.get_stats(req, res);
  }

  parseOptions(opts ?? {});

  return {
    get_stats,
    thumbnail,
    optimize,
  };
};
