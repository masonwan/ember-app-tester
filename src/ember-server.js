const fs = require('fs-promise')
const path = require('path')
const debug = require('debug')('ember-app-tester:ember-server')
const childProcess = require('child_process')
const os = require('os')

module.exports = class EmberServer {
  constructor(options = {}) {
    this.appName = options.appName
    this.appPath = path.join(EmberServer.getDefaultTempDir(), this.appName)
    this.args = options.args || ['serve']
    this.process = null
  }

  start() {
    return fs.access(this.appPath, fs.X_OK).then(() => true).catch(() => false)
      .then((isAccessible) => {
        if (!isAccessible) {
          throw new Error(`'${this.appPath}' is not accessible`)
        }
      })
      .then(() => {
        debug(`Serving Ember app at '${this.appPath} with port '${this.port}'`)

        return new Promise((resolve, reject) => {
          const process = childProcess.spawn('ember', this.args, { cwd: this.appPath })
          this.process = process

          // Make sure the build completes by monitoring the stdout.
          let outputMessage = ''
          const onData = (buffer) => {
            outputMessage += buffer.toString()
            if (outputMessage.includes('Build successful')) {
              process.stdout.removeListener('data', onData)
              resolve()
            }
          }
          process.stdout.on('data', onData)

          // Handle errors.
          process.stderr.once('data', (buffer) => {
            reject(new Error(`Message sent to stderr:\n${buffer.toString()}`))
          })
          process.once('error', (err) => reject(err))
        })
          .catch((err) => {
            // Make sure the process is killed when error happens.
            this.stop()
            throw err
          })
      })
  }

  stop() {
    if (!this.process) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      this.process.once('exit', () => {
        resolve()
      })
      this.process.kill('SIGKILL')
    })
  }

  static getDefaultTempDir() {
    return path.join(os.tmpdir(), 'ember-app-tester');
  }
}