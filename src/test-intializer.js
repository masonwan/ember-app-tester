const path = require('path')
const fs = require('fs-promise')
const os = require('os')
const childProcess = require('child_process')
const debug = require('debug')('ember-app-tester:test-initializer')
const assert = require('assert')

class TestInitializer {
  constructor(options = {}) {
    if (!options.appsRootPath) {
      throw new Error(`'options.appsRootPath' is required.`)
    }
    this.appsRootPath = options.appsRootPath
  }

  initialize() {
    return Promise.resolve()
      .then(() => {
        return fs.readdir(this.appsRootPath)
      })
      .then((files) => {
        let promises = files
          .map((file) => {
            let fullFilename = path.join(this.appsRootPath, file)
            return fs.stat(fullFilename)
              .then((stat) => {
                return {
                  filename: fullFilename,
                  isDirectory: stat.isDirectory(),
                }
              })
          })
        return Promise.all(promises)
      })
      .then((fileInfoList) => {
        let appDirs = fileInfoList
          .filter((fileInfo) => fileInfo.isDirectory)
          .map((fileInfo) => fileInfo.filename)

        let tempDir = path.join(os.tmpdir(), 'test-initializer')

        let promises = appDirs
          .map((appDir) => {
            let appDirName = path.basename(appDir)
            let destinationDir = path.join(tempDir, appDirName)

            return Promise.resolve()
              .then(() => {
                debug(`Copy '${appDir}' to '${destinationDir}'`)
                return fs.copy(appDir, destinationDir)
              })
              .then(() => {
                return Promise.all([
                  this.installBower(destinationDir),
                  this.installNpm(destinationDir),
                ])
              })
          })

        return Promise.all(promises)
      })
  }

  installBower(destinationDir) {
    return new Promise(function(resolve, reject) {
      const child = childProcess.spawn('bower', ['install'], { cwd: destinationDir })
      debug(`Installing Bower for ${destinationDir}`)
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
      child.once('close', () => resolve())
      child.once('error', (err) => reject(err))
    })
  }

  installNpm(destinationDir) {
    return new Promise(function(resolve, reject) {
      debug(`Installing NPM`)
      const child = childProcess.spawn('npm', ['install'], { cwd: destinationDir })
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
      child.once('close', () => resolve())
      child.once('error', (err) => reject(err))
    })
  }
}

let testInitializer = new TestInitializer({
  appsRootPath: path.join(__dirname, 'test', 'apps'),
})

testInitializer.initialize()
