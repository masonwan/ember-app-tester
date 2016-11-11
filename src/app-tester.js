const childProcess = require('child_process')
const debug = require('debug')('ember-app-tester:app-tester')

module.exports = class AppTester {

  constructor(options = {}) {
    this.appPath = options.appPath
    this.port = options.port || 4200
    this.childProcess = null
  }

  startEmberServe() {
    debug(`Serving Ember app at '${this.appPath} with port '${this.port}'`)

    return new Promise((resolve, reject) => {
      const child = childProcess.spawn('ember', [
        'serve',
        '--port',
        this.port,
      ], { cwd: this.appPath })
      this.childProcess = child

      // Make sure the build completes by monitoring the stdout.
      let outputMessage = ''
      child.stdout.on('data', (buffer) => {
        let s = buffer.toString()
        debug(s)
        outputMessage += s
        if (outputMessage.includes('Build successful')) {
          resolve()
        }
      })

      // Handle errors.
      child.stderr.once('data', (buffer) => {
        reject(new Error(`Message sent to stderr:\n${buffer.toString()}`))
      })
      child.once('error', (err) => reject(err))
    })
      .catch((err) => {
        // Make sure the process is killed when error happens.
        this.killChildProcess()
        throw err
      })
  }

  stopEmberServe() {
    this.killChildProcess()
  }

  killChildProcess() {
    if (this.childProcess) {
      this.childProcess.kill('SIGKILL')
    }
  }
}