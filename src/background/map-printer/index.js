const http = require('http')
const mapRouter = require('./server')
const background = require('..')
const logger = require('../../logger')

var handlers = {}
var server = null

handlers.close = async (opts) => {
  return new Promise((resolve, reject) => {
    if (!server) return resolve()
    server.close((err) => {
      if (err) {
        logger.error('Could not close map printer', err)
        return reject(err)
      }
      resolve()
    })
  })
}

handlers.listen = async (mapPrinterPort) => {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      mapRouter.handle(req, res)
    })
    server.listen(mapPrinterPort, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

background(handlers)
