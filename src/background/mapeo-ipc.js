const rabbit = require('electron-rabbit')
const os = require('os')
const http = require('http')

const Mapeo = require('./mapeo')
const createTileServer = require('./tile-server')
const logger = require('../logger')
const createRouter = require('./server')

class MapeoManager {
  constructor ({ datadir, userDataPath, port, tileport }) {
    this.mapeo = null
    this.tileServer = null
    this.opts = { datadir, userDataPath, port, tileport }
    this.router = null
  }

  listen (cb) {
    let pending = 2

    this._createMapeo(() => {
      if (!this.server) {
        this.server = http.createServer((req, res) => {
          logger.debug('server request', req.url)
          this.router(req, res)
        })
      }
      this.server.listen(this.opts.port, '127.0.0.1', () => {
        logger.info('osm-p2p-server listening on :', this.server.address().port)
        if (--pending === 0) cb(this.server.address().port)
      })
    })

    this.tileServer = createTileServer(this.opts.userDataPath)
    this.tileServer.listen(this.opts.tileport, () => {
      logger.info('Tile server listening on :', this.tileServer.address().port)
      if (--pending === 0) cb(this.mapeo.server.address().port)
    })
  }

  _createMapeo (cb) {
    var ipcSend = rabbit.send
    logger.info('Creating a new mapeo', this.opts)
    this.mapeo = new Mapeo({
      datadir: this.opts.datadir,
      userDataPath: this.opts.userDataPath,
      ipcSend
    })

    var { router, core } = createRouter(this.mapeo.osm, this.mapeo.media, {
      staticRoot: this.opts.userDataPath,
      ipcSend
    })

    this.router = router

    this.mapeo.listen(core, () => {
      // hostname often includes a TLD, which we remove
      const computerName = (os.hostname() || 'Mapeo Desktop').split('.')[0]
      this.mapeo.core.sync.setName(computerName)
      cb()
    })
  }

  reloadConfig (cb) {
    logger.debug('closing old mapeo')
    this.mapeo.close(() => {
      this.mapeo = null
      logger.debug('opening new one')
      this._createMapeo(cb)
    })
  }

  close (cb) {
    if (!this.mapeo) return cb()
    this.mapeo.close((err) => {
      if (err) return cb(err)
      this.mapeo = null
      this.server.close((err) => {
        if (err) return cb(err)
        this.server = null
        this.tileServer.close((err) => {
          if (err) return cb(err)
          this.tileServer = null
          cb()
        })
      })
    })
  }
}

var handlers = {}
var manager = null

handlers['reload-config'] = async () => {
  return new Promise((resolve, reject) => {
    manager.reloadConfig((err) => {
      if (err) {
        logger.error('Reload config', err)
        return reject(err)
      }
      logger.info('Configuration reloaded')
      resolve()
    })
  })
}

handlers.close = async () => {
  return new Promise((resolve, reject) => {
    if (!manager) return resolve()
    manager.close((err) => {
      logger.info('CLOSED')
      if (err) {
        logger.error('Could not close', err)
        return reject(err)
      }
      resolve()
    })
  })
}

handlers.listen = async (opts) => {
  if (!manager) manager = new MapeoManager(opts)
  return new Promise((resolve, reject) => {
    manager.listen((port) => {
      logger.info('Sync listening on ', port)
      resolve(port)
    })
  })
}

handlers['import-tiles'] = async (filename) => {
  return new Promise((resolve, reject) => {
    manager.mapeo.tiles.go(filename, (err) => {
      if (err) {
        logger.error(`mapeo.tiles.go(${filename})`, err)
        return reject(err)
      } else resolve()
    })
  })
}

handlers['encryption-key'] = async () => {
  return new Promise((resolve, reject) => {
    resolve(manager.mapeo.encryptionKey)
  })
}

handlers['import-data'] = async (filename) => {
  manager.mapeo.core.importer.importFromFile(filename)
}

handlers['sync-start'] = async (target) => {
  manager.mapeo.syncStart(target)
}

handlers['sync-join'] = async () => {
  manager.mapeo.syncJoin()
}

handlers['sync-leave'] = async () => {
  manager.mapeo.syncLeave()
}

handlers['export-data'] = async (args) => {
  logger.info('Exporting data', args)
  return new Promise((resolve, reject) => {
    manager.mapeo.exportData(args, (err) => {
      if (err) {
        logger.error(`mapeo.exportData(${args})`, err)
        return reject(err)
      }
      resolve()
    })
  })
}

handlers['zoom-to-data-get-centroid'] = async (type) => {
  return new Promise((resolve, reject) => {
    manager.mapeo.getDatasetCentroid(type, (err, loc) => {
      if (err) {
        logger.error(`mapeo.getDatasetCentroid(${type})`, err)
        return reject(err)
      }
      resolve(loc)
    })
  })
}

handlers.debugging = async (bool) => {
  logger.debugging(bool)
}

module.exports = handlers
