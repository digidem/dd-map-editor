var fs = require('fs')
var tar = require('tar-fs')
var pump = require('pump')
var path = require('path')
var ipc = require('electron').ipcMain
var app = require('electron').app
var userDataPath = app.getPath('userData')
var cssPath = path.join(userDataPath, 'style.css')
var iconsPath = path.join(userDataPath, 'icons.svg')

var SETTINGS_FILES = [
  'presets.json',
  'style.css',
  'imagery.json',
  'translations.json',
  'icons.svg',
  'metadata.json'
]

function readJsonSync (filepath) {
  try {
    var data = fs.readFileSync(filepath, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    return null
  }
}

function readFile (filepath) {
  try {
    return fs.readFileSync(filepath, 'utf8')
  } catch (e) {
    return null
  }
}

function importSettings (win, settingsFile, cb) {
  var source = fs.createReadStream(settingsFile)
  var dest = tar.extract(userDataPath, {
    ignore: function (name) {
      return SETTINGS_FILES.indexOf(path.basename(name)) < 0
    }
  })
  pump(source, dest, function (err) {
    if (err) return cb(err)
    win.webContents.send('updated-settings')
    cb()
  })
}

function getSettings (type) {
  switch (type) {
    case 'css':
      return readFile(cssPath)
    case 'icons':
      return readFile(iconsPath)
    case 'presets':
    case 'translations':
    case 'imagery':
    case 'metadata':
      return readJsonSync(path.join(userDataPath, type + '.json'))
    default:
      return null
  }
}

ipc.on('get-user-data', function (event, type) {
  var data = getSettings(type)
  if (!data) console.warn('unhandled event', type)
  event.returnValue = data
})

module.exports = {
  importSettings: importSettings,
  getSettings: getSettings
}
