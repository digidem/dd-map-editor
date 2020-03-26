var path = require('path')
var createMapeoRouter = require('mapeo-server')
var ecstatic = require('ecstatic')
var createOsmRouter = require('osm-p2p-server')
var http = require('http')
var logger = console

module.exports = function (osm, media, opts) {
  if (!opts) opts = {}
  var osmRouter = createOsmRouter(osm)

  var mapeoRouter = createMapeoRouter(osm, media, {
    staticRoot: opts.staticRoot,
    writeFormat: 'osm-p2p-syncfile',
    deviceType: 'desktop'
  })

  var server = http.createServer(function (req, res) {
    logger.log(req.method + ': ' + req.url)

    var staticHandler = ecstatic({
      root: path.join(__dirname, '..', '..', 'static'),
      baseDir: 'static'
    })

    var m = osmRouter.handle(req, res) || mapeoRouter.handle(req, res)
    if (!m) {
      staticHandler(req, res, function (err) {
        if (err) logger.error(err)
        res.statusCode = 404
        res.end('Not Found')
      })
    }
  })

  // TODO(KM): leaky abstraction
  server.mapeoRouter = mapeoRouter

  return server
}
